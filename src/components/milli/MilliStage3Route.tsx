import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WAYPOINTS, type WaypointPoint, FLIGHT_TELEMETRY } from '../../data/milliData';
import { SoundFx } from '../../game/utils/audio';

interface MilliStage3RouteProps {
  onComplete: (waypoints: WaypointPoint[]) => void;
  onFlightStateChange?: (state: { isReady: boolean; isFlying: boolean; isCompleted: boolean }) => void;
  triggerFlight?: boolean;
}

type FlightStatus = 'planning' | 'taking_off' | 'flying' | 'loitering' | 'completed';

interface Point2D {
  x: number;
  y: number;
}

// Normalized Catmull-Rom Spline Evaluator
function evalSpline(
  points: Point2D[],
  progress: number
): { x: number; y: number; dx: number; dy: number; segmentIndex: number } {
  const numSegments = points.length - 1;
  const clampedProgress = Math.max(0, Math.min(0.9999, progress));
  const totalT = clampedProgress * numSegments;
  const segIndex = Math.floor(totalT);
  const t = totalT - segIndex;

  const p0 =
    segIndex > 0
      ? points[segIndex - 1]
      : {
          x: points[0].x - (points[1].x - points[0].x),
          y: points[0].y - (points[1].y - points[0].y),
        };
  const p1 = points[segIndex];
  const p2 = points[segIndex + 1];
  const p3 =
    segIndex + 2 < points.length
      ? points[segIndex + 2]
      : {
          x: points[segIndex + 1].x + (points[segIndex + 1].x - points[segIndex].x),
          y: points[segIndex + 1].y + (points[segIndex + 1].y - points[segIndex].y),
        };

  const t2 = t * t;
  const t3 = t2 * t;

  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

  const dx =
    0.5 *
    (-p0.x +
      p2.x +
      2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t +
      3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);

  const dy =
    0.5 *
    (-p0.y +
      p2.y +
      2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t +
      3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);

  return { x, y, dx, dy, segmentIndex: segIndex };
}

// Generate pre-computed dense spline path points for SVG rendering
function generateDenseSpline(points: Point2D[], samples = 140): Point2D[] {
  const result: Point2D[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const { x, y } = evalSpline(points, t);
    result.push({ x, y });
  }
  return result;
}

// Asset already faces ~2 o'clock in level cruise perspective; keep base angle at 0deg
const BASE_ASSET_ANGLE = 0;

export const MilliStage3Route: React.FC<MilliStage3RouteProps> = ({
  onComplete,
  onFlightStateChange,
  triggerFlight,
}) => {
  // Waypoint Selection State: Sequential picking 1 -> 2 -> 3 -> 4
  const [selectedWaypointIds, setSelectedWaypointIds] = useState<number[]>([1]);
  const [flightStatus, setFlightStatus] = useState<FlightStatus>('planning');

  // Live Telemetry Display State (updated at key milestones)
  const [activeWaypointId, setActiveWaypointId] = useState<number>(1);
  const [currentAltitude, setCurrentAltitude] = useState<number>(180);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);

  // Animation Refs (Direct GPU Transform, Zero React Re-render Bottleneck)
  const uavContainerRef = useRef<HTMLDivElement | null>(null);
  const passedPathRef = useRef<SVGPathElement | null>(null);
  const upcomingPathRef = useRef<SVGPathElement | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number | null>(null);
  const takeoffStartTimeRef = useRef<number | null>(null);
  const loiterStartTimeRef = useRef<number | null>(null);

  const isRouteReady = selectedWaypointIds.length === 4;
  const isFlying = flightStatus === 'taking_off' || flightStatus === 'flying';
  const isCompleted = flightStatus === 'loitering' || flightStatus === 'completed';

  const nextWaypointId =
    selectedWaypointIds.length < 4 ? selectedWaypointIds.length + 1 : null;

  // Waypoints in map percentage space
  const waypointPoints: Point2D[] = WAYPOINTS.map(w => ({
    x: w.mapPercent.x,
    y: w.mapPercent.y,
  }));

  // Pre-sampled dense route curve
  const densePathPointsRef = useRef<Point2D[]>(generateDenseSpline(waypointPoints, 140));

  // Notify parent of flight state changes
  useEffect(() => {
    onFlightStateChange?.({
      isReady: isRouteReady,
      isFlying,
      isCompleted,
    });
  }, [isRouteReady, isFlying, isCompleted, onFlightStateChange]);

  // =========================================================================
  // AUTO-TRANSITION UPON REACHING SUMMIT (1.4s loiter buffer)
  // =========================================================================
  useEffect(() => {
    if (flightStatus === 'loitering') {
      const timer = setTimeout(() => {
        onComplete(WAYPOINTS);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [flightStatus, onComplete]);

  // =========================================================================
  // START FLIGHT ANIMATION SEQUENCE
  // =========================================================================
  const startFlightSequence = useCallback(() => {
    if (!isRouteReady || flightStatus !== 'planning') return;

    SoundFx.playTelemetryBeep();
    try {
      SoundFx.playCarDrive(); // engine spool hum
    } catch {
      // safe fallback
    }

    setFlightStatus('taking_off');
    takeoffStartTimeRef.current = Date.now();
  }, [isRouteReady, flightStatus]);

  // Handle external flight trigger (e.g. from footer button)
  useEffect(() => {
    if (triggerFlight && isRouteReady && flightStatus === 'planning') {
      startFlightSequence();
    }
  }, [triggerFlight, isRouteReady, flightStatus, startFlightSequence]);

  // Handle Waypoint Clicking
  const handleWaypointClick = (point: WaypointPoint) => {
    if (flightStatus !== 'planning') return;

    if (point.id === nextWaypointId) {
      SoundFx.playClickTone();
      const updated = [...selectedWaypointIds, point.id];
      setSelectedWaypointIds(updated);

      if (updated.length === 4) {
        setTimeout(() => {
          SoundFx.playSuccessTone();
        }, 220);
      }
    } else if (selectedWaypointIds.includes(point.id)) {
      SoundFx.playClickTone();
    }
  };

  const handleResetRoute = () => {
    if (flightStatus !== 'planning') return;
    SoundFx.playClickTone();
    setSelectedWaypointIds([1]);
  };

  // Convert points array to SVG path 'd' string
  const pointsToSvgD = (pts: Point2D[]) => {
    if (pts.length < 2) return '';
    return pts.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  };

  // =========================================================================
  // 60 FPS FLIGHT ANIMATION LOOP (requestAnimationFrame)
  // Kinematics, spline evaluation, banking, level cruise flight posture
  // STRICT RULE: No flip, no mirror, no nose pitching into sky!
  // =========================================================================
  useEffect(() => {
    if (flightStatus === 'planning') {
      // Keep UAV stationary at Point 1 runway in its natural horizontal cruise attitude
      if (uavContainerRef.current) {
        const p1 = waypointPoints[0];
        uavContainerRef.current.style.left = `${p1.x}%`;
        uavContainerRef.current.style.top = `${p1.y}%`;
        uavContainerRef.current.style.transform = `translate(-50%, -50%) scale(0.76) rotate(${BASE_ASSET_ANGLE}deg)`;
      }
      return;
    }

    const densePoints = densePathPointsRef.current;
    const takeoffDuration = 1800; // 1.8s takeoff acceleration
    const flightDuration = 11000; // 11s cruise along spline route

    const frameLoop = () => {
      const now = Date.now();

      // -----------------------------------------------------------------------
      // 1. TAKEOFF PHASE
      // -----------------------------------------------------------------------
      if (flightStatus === 'taking_off') {
        const start = takeoffStartTimeRef.current || now;
        const elapsed = now - start;
        const t = Math.min(1, elapsed / takeoffDuration);

        // Smooth cubic ease-in for runway roll
        const easedT = t * t;
        const p1 = waypointPoints[0];

        // Runway climb micro-vibration
        const jitterY = Math.sin(now * 0.04) * (1 - t) * 0.3;

        // Keep pitch almost completely level during takeoff (strictly between 0deg and -1.8deg)
        const takeoffPitch = -t * 1.8;
        const takeoffAlt = Math.round(180 + easedT * 70);
        const takeoffSpeed = Math.round(easedT * 64);

        setCurrentAltitude(takeoffAlt);
        setCurrentSpeed(takeoffSpeed);

        if (uavContainerRef.current) {
          // Takeoff roll forward-up
          uavContainerRef.current.style.left = `${p1.x - easedT * 1.6}%`;
          uavContainerRef.current.style.top = `${p1.y - easedT * 1.2 + jitterY * 0.1}%`;
          uavContainerRef.current.style.transform = `translate(-50%, -50%) scale(${
            0.76 - easedT * 0.02
          }) rotate(${takeoffPitch}deg)`;
        }

        if (t < 1) {
          animFrameIdRef.current = requestAnimationFrame(frameLoop);
        } else {
          setFlightStatus('flying');
          flightStartTimeRef.current = Date.now();
          animFrameIdRef.current = requestAnimationFrame(frameLoop);
        }
        return;
      }

      // -----------------------------------------------------------------------
      // 2. CRUISE FLIGHT PHASE ALONG CATMULL-ROM SPLINE
      // -----------------------------------------------------------------------
      if (flightStatus === 'flying') {
        const start = flightStartTimeRef.current || now;
        const elapsed = now - start;
        const rawProgress = Math.min(1, elapsed / flightDuration);

        // Smooth easeInOut for liftoff to cruise
        const progress =
          rawProgress < 0.5
            ? 2 * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

        // Evaluate Catmull-Rom Position & Tangent
        const { x, y, dx, dy } = evalSpline(waypointPoints, progress);

        // Micro-air turbulence drift
        const waveTime = elapsed * 0.0028;
        const driftY = Math.sin(waveTime * 2.2) * 0.15;
        const driftPitch = Math.sin(waveTime * 1.8) * 0.5;

        // Perspective Scaling:
        // Start: ~0.76 -> Mid-distance: ~0.65 -> Distant Summit (Point 4): ~0.54
        const scale = 0.76 - 0.22 * Math.pow(progress, 0.85);

        // Physical pitch strictly bounded between -3deg and +3deg so nose NEVER points up into the sky!
        const rawPitch = -(dy * 0.12) + driftPitch;
        const pitch = Math.max(-3, Math.min(3, rawPitch));

        // Curvature rate for natural banking roll (strictly bounded to [-6deg, +6deg])
        const aheadProgress = Math.min(0.9999, progress + 0.025);
        const ahead = evalSpline(waypointPoints, aheadProgress);
        let deltaTurn = Math.atan2(ahead.dy, ahead.dx) - Math.atan2(dy, dx);
        while (deltaTurn > Math.PI) deltaTurn -= 2 * Math.PI;
        while (deltaTurn < -Math.PI) deltaTurn += 2 * Math.PI;
        const bankRoll = Math.max(-6, Math.min(6, (deltaTurn * 180 / Math.PI) * 1.6));

        // Slight heading trim bounded to [-4deg, +4deg]
        let angleDiff = Math.atan2(dy, dx) * (180 / Math.PI) - (-30);
        while (angleDiff > 180) angleDiff -= 360;
        while (angleDiff < -180) angleDiff += 360;
        const headingTrim = Math.max(-4, Math.min(4, angleDiff * 0.08));

        // Total rotation (level cruise with gentle bank)
        const totalPitch = BASE_ASSET_ANGLE + pitch + headingTrim;

        // Update UAV Transform (GPU accelerated, contain, no flip)
        if (uavContainerRef.current) {
          uavContainerRef.current.style.left = `${x}%`;
          uavContainerRef.current.style.top = `${y + driftY}%`;
          uavContainerRef.current.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${totalPitch}deg) rotateZ(${bankRoll}deg)`;
        }

        // Camera breathing pan
        if (mapWrapperRef.current) {
          const panX = (50 - x) * 0.035;
          const panY = (50 - y) * 0.025;
          mapWrapperRef.current.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
        }

        // Dynamic Route Split (Traversed vs Upcoming)
        const splitIndex = Math.min(
          densePoints.length - 1,
          Math.floor(progress * (densePoints.length - 1))
        );
        const passedPts = densePoints.slice(0, splitIndex + 1);
        const upcomingPts = densePoints.slice(splitIndex);

        if (passedPathRef.current) {
          passedPathRef.current.setAttribute('d', pointsToSvgD(passedPts));
        }
        if (upcomingPathRef.current) {
          upcomingPathRef.current.setAttribute('d', pointsToSvgD(upcomingPts));
        }

        // Telemetry Altitude & Speed
        const alt = Math.round(180 + 420 * Math.pow(progress, 0.9));
        setCurrentAltitude(alt);
        setCurrentSpeed(72);

        // Milestone checkpoints
        if (progress > 0.72) {
          if (activeWaypointId !== 4) {
            setActiveWaypointId(4);
            SoundFx.playTelemetryBeep();
          }
        } else if (progress > 0.42) {
          if (activeWaypointId !== 3) {
            setActiveWaypointId(3);
            SoundFx.playTelemetryBeep();
          }
        } else if (progress > 0.12) {
          if (activeWaypointId !== 2) {
            setActiveWaypointId(2);
            SoundFx.playTelemetryBeep();
          }
        }

        if (rawProgress < 1) {
          animFrameIdRef.current = requestAnimationFrame(frameLoop);
        } else {
          setFlightStatus('loitering');
          loiterStartTimeRef.current = Date.now();
          SoundFx.playSuccessTone();
          animFrameIdRef.current = requestAnimationFrame(frameLoop);
        }
        return;
      }

      // -----------------------------------------------------------------------
      // 3. LOITER / OBSERVATION ORBIT AT SUMMIT (Waypoint 4)
      // -----------------------------------------------------------------------
      if (flightStatus === 'loitering') {
        const start = loiterStartTimeRef.current || now;
        const elapsed = now - start;
        const p4 = waypointPoints[3];

        // Smooth gentle observation orbit over target area (scale 0.54)
        const loiterRadiusX = 1.2;
        const loiterRadiusY = 0.8;
        const orbitAngle = elapsed * 0.0008; // slow cruise speed

        const orbitX = p4.x + Math.cos(orbitAngle) * loiterRadiusX;
        const orbitY = p4.y + Math.sin(orbitAngle) * loiterRadiusY;
        const loiterPitch = Math.sin(orbitAngle) * 2;

        setCurrentAltitude(600);
        setCurrentSpeed(48); // observation speed

        if (uavContainerRef.current) {
          uavContainerRef.current.style.left = `${orbitX}%`;
          uavContainerRef.current.style.top = `${orbitY}%`;
          uavContainerRef.current.style.transform = `translate(-50%, -50%) scale(0.54) rotate(${loiterPitch}deg) rotateZ(3deg)`;
        }

        animFrameIdRef.current = requestAnimationFrame(frameLoop);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(frameLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [flightStatus, activeWaypointId, waypointPoints]);

  // Full Route SVG Path D (for planning phase)
  const fullPathD = pointsToSvgD(densePathPointsRef.current);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes jetThrustFlicker {
          0% { opacity: 0.65; transform: translate(-100%, -50%) rotate(24deg) scaleX(0.85); }
          100% { opacity: 0.95; transform: translate(-100%, -50%) rotate(24deg) scaleX(1.15); }
        }
      `}</style>

      {/* =========================================================================
          1. FULLSCREEN AERIAL CAMPUS VIEWPORT (Direct Aerial Canvas)
          ========================================================================= */}
      <div
        ref={mapWrapperRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          transition: 'transform 0.4s ease-out',
          zIndex: 1,
        }}
      >
        {/* Aerial Campus Background Panorama */}
        <img
          src="/assets/milli/pau_aerial_bg.jpg"
          alt="Pamukkale Üniversitesi Kampüsü ve Uçuş Sahası"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.92) contrast(1.05)',
          }}
        />

        {/* Dynamic Dark Vignette for HUD & Flight Path Contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 50% 50%, rgba(4, 9, 20, 0.15) 0%, rgba(3, 8, 18, 0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* SVG Route Trajectory Overlay */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <defs>
            <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <filter id="routeNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#00F2FE" />
            </filter>
          </defs>

          {/* Planning Phase: Connected dashed route as waypoints are selected */}
          {flightStatus === 'planning' && isRouteReady && (
            <>
              {/* Soft Cyan Shadow Path */}
              <path
                d={fullPathD}
                fill="none"
                stroke="#00F2FE"
                strokeWidth="1.2"
                strokeOpacity="0.35"
                strokeLinecap="round"
                filter="url(#routeNeonGlow)"
              />
              {/* Streaming Dashed Route Line */}
              <path
                d={fullPathD}
                fill="none"
                stroke="url(#activeRouteGrad)"
                strokeWidth="0.85"
                strokeDasharray="2.2 1.4"
                strokeLinecap="round"
                style={{ animation: 'routeDashFlow 1.6s linear infinite' }}
              />
            </>
          )}

          {/* Flight Phase: Traversed Path (Subtle Low Opacity) */}
          {(flightStatus === 'flying' || flightStatus === 'loitering') && (
            <path
              ref={passedPathRef}
              fill="none"
              stroke="#00F2FE"
              strokeWidth="0.65"
              strokeOpacity="0.25"
              strokeDasharray="1.5 1.5"
              strokeLinecap="round"
            />
          )}

          {/* Flight Phase: Active Upcoming Path (Glow & Stream Ahead) */}
          {(flightStatus === 'flying' || flightStatus === 'taking_off') && (
            <path
              ref={upcomingPathRef}
              fill="none"
              stroke="url(#activeRouteGrad)"
              strokeWidth="0.95"
              strokeDasharray="2.4 1.4"
              strokeLinecap="round"
              filter="url(#routeNeonGlow)"
              style={{ animation: 'routeDashFlow 1.4s linear infinite' }}
            />
          )}
        </svg>

        {/* Waypoint 4 Concentric Radar Scanner Rings */}
        <div
          style={{
            position: 'absolute',
            left: `${WAYPOINTS[3].mapPercent.x}%`,
            top: `${WAYPOINTS[3].mapPercent.y}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 12,
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              border: '1.5px dashed rgba(239, 68, 68, 0.45)',
              transform: 'translate(-50%, -50%)',
              animation: 'spinSlow 14s linear infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              border: '2px solid rgba(239, 68, 68, 0.65)',
              transform: 'translate(-50%, -50%)',
              animation: 'radarPulse 2s infinite ease-out',
            }}
          />
        </div>

        {/* Waypoint Markers on Map */}
        {WAYPOINTS.map(point => {
          const isConfirmed = selectedWaypointIds.includes(point.id);
          const isNext = point.id === nextWaypointId;
          const isPassedInFlight =
            (flightStatus === 'flying' || flightStatus === 'loitering') &&
            activeWaypointId >= point.id;

          return (
            <div
              key={point.id}
              onClick={() => handleWaypointClick(point)}
              style={{
                position: 'absolute',
                left: `${point.mapPercent.x}%`,
                top: `${point.mapPercent.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor:
                  flightStatus === 'planning' && (isNext || isConfirmed)
                    ? 'pointer'
                    : 'default',
                zIndex: isNext ? 26 : 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Radar pulse for next selectable waypoint in planning */}
              {flightStatus === 'planning' && isNext && (
                <div
                  style={{
                    position: 'absolute',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: `2px solid ${point.color}`,
                    animation: 'radarPulse 1.8s infinite ease-out',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Waypoint Pin Badge */}
              <div
                style={{
                  width: isNext ? '46px' : '38px',
                  height: isNext ? '46px' : '38px',
                  borderRadius: '50%',
                  background: isPassedInFlight
                    ? 'linear-gradient(135deg, #10B981 0%, #047857 100%)'
                    : isConfirmed
                    ? `linear-gradient(135deg, ${point.color} 0%, rgba(5, 20, 40, 0.9) 100%)`
                    : isNext
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                    : 'rgba(15, 25, 45, 0.85)',
                  border: isPassedInFlight
                    ? '2px solid #34D399'
                    : isConfirmed
                    ? `2px solid ${point.color}`
                    : isNext
                    ? '2px solid #FDE68A'
                    : '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: isPassedInFlight
                    ? '0 0 20px #10B981'
                    : isConfirmed || isNext
                    ? `0 0 20px ${isNext ? '#F59E0B' : point.color}`
                    : '0 4px 10px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#FFFFFF',
                  transform: isNext ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                {isPassedInFlight ? (
                  <span style={{ fontWeight: 900, color: '#FFFFFF' }}>✓</span>
                ) : isConfirmed ? (
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>{point.id}</span>
                ) : (
                  <span>{point.icon}</span>
                )}
              </div>

              {/* Label Tooltip */}
              <div
                style={{
                  marginTop: '5px',
                  background: 'rgba(4, 12, 26, 0.88)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${
                    isPassedInFlight
                      ? '#10B981'
                      : isConfirmed
                      ? point.color
                      : 'rgba(255, 255, 255, 0.25)'
                  }`,
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  pointerEvents: 'none',
                }}
              >
                {point.id === 1 ? 'Pamukkale Üniversitesi (Kalkış)' : point.name}
              </div>
            </div>
          );
        })}

        {/* =========================================================================
            CINEMATIC FLIGHT UAV (REDUCED SIZE %25-30, LEVEL ATTITUDE)
            - Proportions preserved (16:9)
            - Reduced responsive width: clamp(135px, 9.8vw, 175px)
            - Level horizontal cruise flight posture (pitch strictly [-3°, +3°])
            - Smooth perspective scaling: 0.76 -> 0.65 -> 0.54
            - Bank roll in turns [-6°, +6°]
            - Sleek cyan jet exhaust, NO propeller
            - Pure transparent PNG with subtle ambient shadow
            ========================================================================= */}
        <div
          ref={uavContainerRef}
          style={{
            position: 'absolute',
            left: `${WAYPOINTS[0].mapPercent.x}%`,
            top: `${WAYPOINTS[0].mapPercent.y}%`,
            width: 'clamp(135px, 9.8vw, 175px)',
            aspectRatio: '16 / 9',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 30,
            willChange: 'transform, left, top',
          }}
        >
          {/* Jet Nozzle Cyan Thrust Glow Shimmer (active during flight) */}
          {flightStatus !== 'planning' && (
            <div
              style={{
                position: 'absolute',
                left: '28%',
                top: '56%',
                width: '28px',
                height: '8px',
                transform: 'translate(-100%, -50%) rotate(24deg)',
                background: 'linear-gradient(270deg, #00F2FE 0%, rgba(0, 242, 254, 0.45) 50%, transparent 100%)',
                filter: 'blur(1.2px)',
                boxShadow: '0 0 8px rgba(0, 242, 254, 0.9), 0 0 16px rgba(0, 242, 254, 0.5)',
                borderRadius: '50% 0 0 50%',
                opacity: flightStatus === 'loitering' ? 0.6 : 0.9,
                animation: 'jetThrustFlicker 0.08s infinite alternate',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          {/* Official New UAV Jet Asset */}
          <img
            src="/assets/milli/uav_flight_stage3.png"
            alt="Pamukkale Üniversitesi Sivil Gözlem ve Erken Uyarı İHA"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              filter:
                'drop-shadow(0 10px 16px rgba(0, 0, 0, 0.55)) drop-shadow(0 2px 6px rgba(0, 242, 254, 0.3))',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          2. LEFT HUD: TASK INSTRUCTIONS & CHECKPOINT PROGRESS
          3. ETAP: ROTANI BELİRLE VE GÖKYÜZÜNE YÜKSEL
          ========================================================================= */}
      <aside
        style={{
          position: 'absolute',
          top: 'clamp(28px, 4.5vh, 48px)',
          left: 'clamp(24px, 2.5vw, 40px)',
          width: 'clamp(290px, 20vw, 340px)',
          background: 'linear-gradient(135deg, rgba(6, 18, 38, 0.92) 0%, rgba(4, 12, 26, 0.84) 100%)',
          borderRadius: '16px',
          padding: '16px 20px',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 242, 254, 0.28)',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#00F2FE',
              flexShrink: 0,
            }}
          >
            🧭
          </div>
          <div>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.5px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                lineHeight: '1.25',
              }}
            >
              ROTANI BELİRLE VE GÖKYÜZÜNE YÜKSEL
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#00F2FE',
                letterSpacing: '0.6px',
                marginTop: '2px',
                textShadow: '0 0 10px rgba(0, 242, 254, 0.6)',
              }}
            >
              GÜVENLİ ROTA, KESİNTİSİZ UÇUŞ
            </div>
          </div>
        </div>

        <p
          style={{
            fontSize: '11.5px',
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: '1.45',
            margin: 0,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          İHA'nı kalkış noktasından görev sahasına ulaştırmak için kontrol noktalarını sırayla seçerek rotanı oluştur, ardından uçağının gökyüzünde süzülüşünü canlı izle.
        </p>

        {/* Görev Info Box */}
        <div
          style={{
            background: 'rgba(0, 242, 254, 0.08)',
            borderLeft: '3px solid #00F2FE',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.5px',
            }}
          >
            <span>🎯</span>
            <span>GÖREV</span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#FFFFFF',
              fontWeight: 600,
              lineHeight: '1.35',
            }}
          >
            {flightStatus === 'planning'
              ? 'Harita üzerinde sırayla 4 kontrol noktası seçerek rotanı tamamla.'
              : isCompleted
              ? 'Tüm kontrol noktaları tamamlandı! 6. Bölüm’e geçiliyor...'
              : 'İHA görev rotasını takip ediyor. Telemetriyi ve uçuş irtifasını izle.'}
          </div>
        </div>

        {/* Progress Tracker (0/4 .. 4/4) */}
        <div style={{ marginTop: '2px' }}>
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: isRouteReady ? '#10B981' : '#00F2FE',
              marginBottom: '6px',
              letterSpacing: '0.4px',
              textShadow: isRouteReady
                ? '0 0 10px rgba(16, 185, 129, 0.6)'
                : '0 0 10px rgba(0, 242, 254, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>
              {flightStatus === 'loitering' || flightStatus === 'completed'
                ? '4 / 4 Rota ve Uçuş Tamamlandı'
                : `${selectedWaypointIds.length} / 4 Kontrol Noktası Seçildi`}
            </span>
            {isRouteReady && (
              <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 700 }}>
                {flightStatus === 'planning' ? '✓ Rota Hazır' : '✈️ Uçuşta'}
              </span>
            )}
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.18)',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(selectedWaypointIds.length / 4) * 100}%`,
                background: 'linear-gradient(90deg, #00F2FE, #10B981)',
                borderRadius: '2px',
                transition: 'width 0.35s ease',
              }}
            />
            {[1, 2, 3, 4].map(id => {
              const isDone = selectedWaypointIds.includes(id);
              return (
                <div
                  key={id}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: isDone ? '#10B981' : 'rgba(12, 26, 48, 0.95)',
                    border: `2px solid ${isDone ? '#34D399' : 'rgba(0, 242, 254, 0.5)'}`,
                    boxShadow: isDone ? '0 0 10px #10B981' : 'none',
                    zIndex: 2,
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          3. TOP-RIGHT COMPASS ROSE
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(28px, 4.5vh, 48px)',
          right: 'clamp(24px, 2.5vw, 40px)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(6, 18, 38, 0.85)',
          border: '1.5px solid rgba(0, 242, 254, 0.45)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(0, 242, 254, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 900, color: '#00F2FE', lineHeight: '1' }}>
          ▲
        </span>
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.5px' }}>
          N
        </span>
      </div>

      {/* =========================================================================
          4. BOTTOM-LEFT INSPIRATIONAL KAŞİF TIP BOX
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(16px, 2.8vh, 32px)',
          left: 'clamp(24px, 2.5vw, 40px)',
          width: 'clamp(300px, 22vw, 380px)',
          background: 'rgba(6, 18, 38, 0.85)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '14px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
        <div
          style={{
            fontSize: '11.5px',
            color: 'rgba(255, 255, 255, 0.88)',
            lineHeight: '1.45',
            fontWeight: 500,
          }}
        >
          {flightStatus === 'planning'
            ? "Kontrol noktalarını sırayla seçerek İHA'nın uçuş rotasını oluştur. Rota ne kadar iyi olursa görev o kadar başarılı olur!"
            : isCompleted
            ? "Tebrikler! İHA belirlenen rotayı tamamladı ve gözlem sahasına ulaştı."
            : "İHA belirlenen koordinatları hassas şekilde tarıyor. İrtifa ve telemetri değerlerini takip et."}
        </div>
      </div>

      {/* =========================================================================
          5. BOTTOM-RIGHT COMPACT FLIGHT TELEMETRY HUD
          ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(16px, 2.8vh, 32px)',
          right: 'clamp(24px, 2.5vw, 40px)',
          width: 'clamp(250px, 17vw, 300px)',
          background: 'linear-gradient(135deg, rgba(6, 18, 38, 0.90) 0%, rgba(4, 12, 26, 0.84) 100%)',
          borderRadius: '14px',
          padding: '14px 18px',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 800,
            color: '#00F2FE',
            letterSpacing: '0.6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{flightStatus === 'planning' ? '📊 UÇUŞ BİLGİLERİ' : '🛰️ UÇUŞ DURUMU'}</span>
          {isCompleted && (
            <span style={{ color: '#10B981', fontSize: '10.5px' }}>✓ TAMAMLANDI</span>
          )}
        </div>

        {flightStatus === 'planning' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Toplam Mesafe:</span>
              <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.totalDistance}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Tahmini Süre:</span>
              <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.estimatedTime}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Maksimum İrtifa:</span>
              <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.maxAltitude}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Seyir Hızı:</span>
              <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{FLIGHT_TELEMETRY.cruisingSpeed}</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Hedef:</span>
              <span style={{ fontWeight: 800, color: '#FDE68A' }}>
                {WAYPOINTS[Math.min(3, activeWaypointId - 1)].name}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Kontrol Noktası:</span>
              <span style={{ fontWeight: 800, color: '#00F2FE' }}>
                {isCompleted ? '4 / 4' : `${activeWaypointId} / 4`}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>İrtifa:</span>
              <span style={{ fontWeight: 800, color: '#10B981' }}>{currentAltitude} metre</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Hız:</span>
              <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{currentSpeed} km/h</span>
            </div>
          </>
        )}

        {/* Reset button during planning mode */}
        {flightStatus === 'planning' && selectedWaypointIds.length > 1 && (
          <button
            onClick={handleResetRoute}
            style={{
              marginTop: '4px',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span>
            <span>Rotayı Sıfırla</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          6. CENTER ACTION PROMPT (Trigger Flight when Route Ready)
          ========================================================================= */}
      {flightStatus === 'planning' && isRouteReady && (
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(20px, 3.2vh, 36px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
          }}
        >
          <button
            id="start-flight-btn"
            onClick={startFlightSequence}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              border: '1.5px solid #FDE68A',
              color: '#050E1F',
              fontSize: '14px',
              fontWeight: 900,
              letterSpacing: '0.6px',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.6), 0 8px 20px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'pulseGlow 2s infinite ease-in-out',
            }}
          >
            <span>✈️</span>
            <span>Rotayı Onayla ve Uçuşa Geç</span>
            <span style={{ fontSize: '16px' }}>→</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          7. FLIGHT COMPLETED SUCCESS FEEDBACK BANNER (Short, professional feedback)
          Transitions directly to Chapter 6 with 1.4s auto-timer or instant click
          ========================================================================= */}
      {isCompleted && (
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(20px, 3.2vh, 36px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(6, 22, 44, 0.96) 0%, rgba(3, 12, 28, 0.94) 100%)',
            border: '1.5px solid #10B981',
            borderRadius: '16px',
            padding: '12px 26px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.55), 0 10px 30px rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(14px)',
            zIndex: 35,
            animation: 'fadeInDown 0.35s ease-out',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#FFFFFF',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.8)',
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#10B981', letterSpacing: '0.5px' }}>
              ROTA VE GÖREV BAŞARIYLA TAMAMLANDI
            </div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.88)', marginTop: '2px' }}>
              Pamukkale Üniversitesi İHA'sı gözlem sahasına ulaştı. 6. Bölüm Uzay Teknolojileri'ne geçiliyor...
            </div>
          </div>
          <button
            id="proceed-to-ch6-btn"
            onClick={() => onComplete(WAYPOINTS)}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '1px solid #6EE7B7',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 18px rgba(16, 185, 129, 0.45)',
              flexShrink: 0,
            }}
          >
            <span>6. Bölüme Geç</span>
            <span style={{ fontSize: '15px' }}>→</span>
          </button>
        </div>
      )}
    </div>
  );
};
