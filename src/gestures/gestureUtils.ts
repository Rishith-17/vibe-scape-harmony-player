/**
 * Fast landmark heuristics for instant gesture detection
 * Optimized for fist and thumbs_up with minimal latency
 */

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureAnalysis {
  label: string | null;
  confidence: number;
  stableFrames: number;
  landmarks?: Landmark[];
}

/**
 * Fast thumbs_up detection using simple geometric rules
 * Priority: Speed > Perfect accuracy for instant response
 */
export function detectThumbsUp(landmarks: Landmark[]): { detected: boolean; confidence: number } {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 };
  }

  const thumb_tip = landmarks[4];
  const thumb_ip = landmarks[3];
  const thumb_mcp = landmarks[2];
  const index_tip = landmarks[8];
  const index_mcp = landmarks[5];
  const middle_tip = landmarks[12];
  const ring_tip = landmarks[16];
  const pinky_tip = landmarks[20];
  const wrist = landmarks[0];

  // Fast heuristic: Thumb extended UP, all other fingers curled DOWN
  // Thumb must be significantly above wrist and extended laterally
  const thumbExtendedUp = thumb_tip.y < (wrist.y - 0.08) && 
                          thumb_tip.y < (thumb_ip.y - 0.06) &&
                          thumb_tip.y < (thumb_mcp.y - 0.08);
  
  const thumbExtendedOut = Math.abs(thumb_tip.x - wrist.x) > 0.10;

  // All other fingers must be curled (tips below or near their MCP joints)
  const fingersCurled = 
    index_tip.y > (index_mcp.y - 0.03) &&
    middle_tip.y > (index_mcp.y - 0.03) &&
    ring_tip.y > (index_mcp.y - 0.03) &&
    pinky_tip.y > (index_mcp.y - 0.03);

  const detected = thumbExtendedUp && thumbExtendedOut && fingersCurled;
  const confidence = detected ? 0.92 : 0;

  if (detected) {
    console.log('👍 [FastHeuristic] THUMBS_UP detected:', {
      thumbUp: thumbExtendedUp,
      thumbOut: thumbExtendedOut,
      fingersCurled,
      confidence
    });
  }

  return { detected, confidence };
}

/**
 * Fast open_hand detection using simple geometric rules
 * Open hand: All fingers extended upward
 */
export function detectOpenHand(landmarks: Landmark[]): { detected: boolean; confidence: number } {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 };
  }

  const thumb_tip = landmarks[4];
  const thumb_mcp = landmarks[2];
  const index_tip = landmarks[8];
  const index_mcp = landmarks[5];
  const middle_tip = landmarks[12];
  const middle_mcp = landmarks[9];
  const ring_tip = landmarks[16];
  const ring_mcp = landmarks[13];
  const pinky_tip = landmarks[20];
  const pinky_mcp = landmarks[17];

  // All fingers must be extended (tips above their MCP joints)
  const thumbExtended = Math.abs(thumb_tip.x - thumb_mcp.x) > 0.06; // Thumb extends sideways
  const indexExtended = index_tip.y < (index_mcp.y - 0.06);
  const middleExtended = middle_tip.y < (middle_mcp.y - 0.06);
  const ringExtended = ring_tip.y < (ring_mcp.y - 0.06);
  const pinkyExtended = pinky_tip.y < (pinky_mcp.y - 0.06);

  const allFingersExtended = thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended;

  // Fingers should be somewhat spread out (not tightly together)
  const fingerSpread = Math.abs(index_tip.x - pinky_tip.x);
  const wellSpread = fingerSpread > 0.12;

  const detected = allFingersExtended && wellSpread;
  const confidence = detected ? 0.88 : 0;

  if (detected) {
    console.log('🖐️ [FastHeuristic] OPEN_HAND detected:', {
      allFingersExtended,
      wellSpread,
      confidence
    });
  }

  return { detected, confidence };
}
export function detectFist(landmarks: Landmark[]): { detected: boolean; confidence: number } {
  if (!landmarks || landmarks.length < 21) {
    return { detected: false, confidence: 0 };
  }

  const thumb_tip = landmarks[4];
  const index_tip = landmarks[8];
  const index_mcp = landmarks[5];
  const middle_tip = landmarks[12];
  const ring_tip = landmarks[16];
  const pinky_tip = landmarks[20];
  const wrist = landmarks[0];

  // Fist: ALL fingers curled with thumb tucked
  const allFingersCurled = 
    thumb_tip.y >= (wrist.y - 0.04) &&  // Thumb at or below wrist
    index_tip.y > (index_mcp.y - 0.02) &&
    middle_tip.y > (index_mcp.y - 0.02) &&
    ring_tip.y > (index_mcp.y - 0.02) &&
    pinky_tip.y > (index_mcp.y - 0.02);

  // Verify fist is compact (fingertips close to wrist)
  const avgTipY = (index_tip.y + middle_tip.y + ring_tip.y + pinky_tip.y) / 4;
  const compact = Math.abs(avgTipY - wrist.y) < 0.15;

  const detected = allFingersCurled && compact;
  const confidence = detected ? 0.90 : 0;

  if (detected) {
    console.log('✊ [FastHeuristic] FIST detected:', { allFingersCurled, compact, confidence });
  }

  return { detected, confidence };
}

/**
 * Analyze gesture from MediaPipe hand landmarks
 * Uses fast heuristics for open_hand, fist, and legacy thumbs_up, fallback to full analysis for others
 */
export function analyzeGestureFromLandmarks(landmarks: Landmark[]): GestureAnalysis {
  if (!landmarks || landmarks.length < 21) {
    return { label: null, confidence: 0, stableFrames: 0 };
  }

  // Fast path: Check open_hand first (highest priority for voice control)
  const openHand = detectOpenHand(landmarks);
  if (openHand.detected) {
    return { label: 'open_hand', confidence: openHand.confidence, stableFrames: 1, landmarks };
  }

  // Fast path: Check fist (play/pause)
  const fist = detectFist(landmarks);
  if (fist.detected) {
    return { label: 'fist', confidence: fist.confidence, stableFrames: 1, landmarks };
  }

  // Full analysis for other gestures (rock, peace)
  return analyzeComplexGestures(landmarks);
}

/**
 * Full gesture analysis for rock and peace gestures
 * Slightly slower but still optimized
 */
function analyzeComplexGestures(landmarks: Landmark[]): GestureAnalysis {
  const thumb_tip = landmarks[4];
  const thumb_mcp = landmarks[2];
  const index_tip = landmarks[8];
  const index_pip = landmarks[6];
  const index_mcp = landmarks[5];
  const middle_tip = landmarks[12];
  const middle_pip = landmarks[10];
  const middle_mcp = landmarks[9];
  const ring_tip = landmarks[16];
  const ring_pip = landmarks[14];
  const pinky_tip = landmarks[20];
  const pinky_pip = landmarks[18];

  const fingerTolerance = 0.06;

  // Finger extended checks
  const thumb_up = thumb_tip.y < (thumb_mcp.y - 0.04);
  const index_up = index_tip.y < (index_pip.y - fingerTolerance) && 
                   index_tip.y < (index_mcp.y - fingerTolerance);
  const middle_up = middle_tip.y < (middle_pip.y - fingerTolerance) && 
                    middle_tip.y < (middle_mcp.y - fingerTolerance);
  const ring_up = ring_tip.y < (ring_pip.y - fingerTolerance);
  const pinky_up = pinky_tip.y < (pinky_pip.y - fingerTolerance);

  const fingersUp = [index_up, middle_up, ring_up, pinky_up].filter(Boolean).length;

  // 🤘 Rock: index + pinky up, rest down
  if (!thumb_up && index_up && !middle_up && !ring_up && pinky_up && fingersUp === 2) {
    console.log('🤘 [ComplexAnalysis] ROCK detected');
    return { label: 'rock', confidence: 0.87, stableFrames: 2, landmarks };
  }

  // ✌️ Peace: index + middle up, rest down
  if (!thumb_up && index_up && middle_up && !ring_up && !pinky_up && fingersUp === 2) {
    console.log('✌️ [ComplexAnalysis] PEACE detected');
    return { label: 'peace', confidence: 0.87, stableFrames: 2, landmarks };
  }

  return { label: null, confidence: 0, stableFrames: 0 };
}
