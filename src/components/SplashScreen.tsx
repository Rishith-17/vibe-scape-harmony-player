import { motion } from 'framer-motion';
import auraWaveLogo from '@/assets/aurawave-logo-new.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2500);
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs background */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-purple-600/20 via-transparent to-transparent blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-gradient-radial from-cyan-500/20 via-transparent to-transparent blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* 3D Logo Container */}
      <motion.div
        className="relative"
        style={{ perspective: '1000px' }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Rotating glow ring */}
        <motion.div
          className="absolute inset-[-30px] rounded-full border-2 border-cyan-400/50"
          style={{
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.4), inset 0 0 40px rgba(34, 211, 238, 0.1)',
          }}
          animate={{
            rotateZ: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotateZ: { duration: 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />

        {/* Second rotating ring */}
        <motion.div
          className="absolute inset-[-50px] rounded-full border border-purple-500/30"
          style={{
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
          }}
          animate={{
            rotateZ: -360,
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* 3D Logo with floating animation */}
        <motion.div
          className="relative z-10"
          animate={{
            rotateY: [0, 10, 0, -10, 0],
            rotateX: [0, 5, 0, -5, 0],
            y: [0, -15, 0],
          }}
          transition={{
            rotateY: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.img
            src={auraWaveLogo}
            alt="AuraWave"
            className="w-40 h-40 object-contain drop-shadow-[0_0_50px_rgba(34,211,238,0.5)]"
            initial={{ filter: 'brightness(0)' }}
            animate={{ filter: 'brightness(1)' }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </motion.div>

        {/* Pulsing glow behind logo */}
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* App name with typewriter effect */}
      <motion.div
        className="mt-12 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <motion.h1
          className="text-4xl font-bold tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 50%, #22d3ee 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(34, 211, 238, 0.5)',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          AuraWave
        </motion.h1>

        {/* Underline animation */}
        <motion.div
          className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-2"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        />
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="mt-4 text-cyan-200/60 text-sm tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        Feel the Music
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        className="mt-8 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-cyan-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
