/**
 * Cut-paper material for the Matisse direction.
 * BoilFilter re-cuts the wobbly edge every `every` frames (a new turbulence seed), the way
 * stop-motion paper animation "boils" between frames, and adds a gouache grain.
 */
export const BoilFilter: React.FC<{
  id: string;
  frame: number;
  every?: number;
  scale?: number;
  freq?: number;
  grain?: number;
}> = ({ id, frame, every = 4, scale = 7, freq = 0.018, grain = 0.18 }) => {
  const seed = 1 + (Math.floor(frame / every) % 7);
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency={freq}
        numOctaves="2"
        seed={seed}
        result="wob"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="wob"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="cut"
      />
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="g" />
      <feColorMatrix in="g" type="saturate" values="0" result="gray" />
      <feComposite
        in="cut"
        in2="gray"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3={-grain}
        k4={grain * 0.45}
        result="paint"
      />
      <feComposite in="paint" in2="cut" operator="in" />
    </filter>
  );
};

/** Shadow of a paper piece lifted from the wall; `lift` 0 = glued flat, 1 = picked up. */
export const LiftFilter: React.FC<{ id: string; lift: number }> = ({ id, lift }) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow
      dx={2 + lift * 10}
      dy={3 + lift * 16}
      stdDeviation={1 + lift * 7}
      floodColor="black"
      floodOpacity={0.18 + lift * 0.12}
    />
  </filter>
);

/**
 * The mascot finish for the cut-paper style: the boiling scissor-cut edge plus the white
 * sticker border (D-019), which boils with it, and a soft shadow.
 */
export const CutoutStickerFilter: React.FC<{
  id: string;
  frame: number;
  every?: number;
  scale?: number;
  border?: number;
  grain?: number;
}> = ({ id, frame, every = 4, scale = 4, border = 12, grain = 0.1 }) => {
  const seed = 1 + (Math.floor(frame / every) % 7);
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.018"
        numOctaves="2"
        seed={seed}
        result="wob"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="wob"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="cut"
      />
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="g" />
      <feColorMatrix in="g" type="saturate" values="0" result="gray" />
      <feComposite
        in="cut"
        in2="gray"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3={-grain}
        k4={grain * 0.45}
        result="paint0"
      />
      <feComposite in="paint0" in2="cut" operator="in" result="paint" />
      <feMorphology in="cut" operator="dilate" radius={border} result="grown0" />
      <feDisplacementMap
        in="grown0"
        in2="wob"
        scale={scale * 1.5}
        xChannelSelector="G"
        yChannelSelector="R"
        result="grown"
      />
      <feFlood floodColor="white" />
      <feComposite in2="grown" operator="in" result="sticker" />
      <feGaussianBlur in="grown" stdDeviation="5" result="soft" />
      <feOffset in="soft" dx="6" dy="10" result="moved" />
      <feFlood floodColor="black" floodOpacity="0.22" />
      <feComposite in2="moved" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="sticker" />
        <feMergeNode in="paint" />
      </feMerge>
    </filter>
  );
};
