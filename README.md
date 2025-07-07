# 🌊 Fourier Wave Generator

[![WebGL](https://img.shields.io/badge/WebGL-2.0%20%7C%201.0-blue.svg)](https://webgl.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-5-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)

A GPU-accelerated wave animation generator using Fourier synthesis, perfect for creating seamlessly tileable animated normal maps and height maps for games and visual effects.

[![Wave Generator Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue?style=for-the-badge&logo=javascript)](https://ammarillo.github.io/WaveGenV2/)

## ✨ Features

### 🌊 **Fourier Wave Synthesis**
- Mathematical wave generation using sum of sinusoids
- Natural, ocean-like wave patterns with up to 8 configurable components
- Real-time GPU rendering with WebGL 2.0/1.0
- Wave sharpening for realistic oscilloscope-like waveforms

### 🔄 **Perfect Looping Animation**
- Temporal frequencies constrained to integers for mathematically guaranteed loop continuity
- Customizable loop duration and playback speed
- Seamless temporal loops perfect for game engines

### 🧩 **Seamless Texture Tiling**
- Spatial frequencies quantized for seamless texture tiling
- Perfect for game engine texture mapping
- No visible seams when tiled in any direction

### 🎛️ **Dual Output Modes**
- **Normal Maps**: RGB normal maps for surface detail and lighting effects
- **Height Maps**: Grayscale displacement maps for tessellation and vertex displacement

### 📦 **Advanced Export System**
- Export animation sequences as ZIP files
- Configurable resolution (256x256 to 4096x4096)
- Configurable frame count (8-120 frames)
- Organized file naming with mode prefixes

### 💾 **Preset System**
- Export current settings as JSON presets
- Import and share preset configurations
- Version-controlled preset format with backward compatibility

### 🎨 **Real-time Controls**
- Live parameter adjustment with instant visual feedback
- Randomization tools for quick exploration
- Auto-save functionality for persistent settings

## 🚀 Quick Start

### Prerequisites
- Modern web browser with WebGL support
- Local HTTP server (for file access)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fourier-wave-generator.git
   cd fourier-wave-generator
   ```

2. **Start a local server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Start creating waves!** 🌊

## 📖 Usage Guide

### Basic Workflow

1. **Configure Wave Layers**: Adjust amplitude, frequency, direction, and phase for each Fourier component
2. **Set Global Parameters**: Configure wave scale, normal intensity, and height range
3. **Choose Output Mode**: Select between normal maps or height maps
4. **Export Animation**: Generate ZIP file with your animation sequence

### Wave Parameters

Each Fourier component includes:

| Parameter | Range | Description |
|-----------|-------|-------------|
| **Amplitude** | 0.01 - 1.0 | Wave height and intensity |
| **Spatial Frequency** | 0.1 - 5.0 | Wave density in space |
| **Temporal Frequency** | 1-16 (integers) | Animation speed for perfect looping |
| **Direction X/Y** | -1.0 - 1.0 | Wave propagation direction |
| **Phase** | 0 - 2π | Initial phase offset |
| **Sharpness** | 0.0 - 1.0 | Wave shape sharpening |

### Output Modes

#### Normal Maps
- **Purpose**: Surface detail and lighting effects
- **Format**: RGB normal maps
- **Controls**: Normal intensity, normalize normals
- **Use Cases**: Game lighting, material effects

#### Height Maps
- **Purpose**: Displacement and tessellation
- **Format**: Grayscale displacement maps
- **Controls**: Height range, normalize heights
- **Use Cases**: Vertex displacement, terrain generation

## 🧮 Mathematical Foundation

### Overview

This wave generator implements a sophisticated multi-layer Fourier synthesis system that creates realistic ocean wave patterns through mathematical modeling of wave physics. The system goes beyond simple sine wave summation by incorporating wave sharpening, analytical derivatives, and seamless tiling mathematics.

### 🌊 Core Wave Mathematics

#### Fourier Wave Synthesis

The fundamental approach uses Fourier analysis to decompose complex wave patterns into simpler sinusoidal components:

```
H(x,y,t) = Σᵢ Aᵢ × f(sin(φᵢ), sᵢ)
```

Where each wave component `i` has:
- **Amplitude** (`Aᵢ`): Controls wave height
- **Spatial Frequency** (`fᵢ`): Controls wave density/spacing
- **Temporal Frequency** (`ωᵢ`): Controls wave speed
- **Direction** (`d⃗ᵢ`): Controls wave propagation direction
- **Phase Offset** (`φ₀ᵢ`): Controls wave positioning
- **Sharpness** (`sᵢ`): Controls wave profile shape

#### Phase Calculation

The phase determines the wave's position in space and time:

```
φᵢ = k⃗ᵢ · uv⃗ + ωᵢt + φ₀ᵢ
```

**Components:**
- `k⃗ᵢ = (kₓ, kᵧ)`: Wave vector determining spatial frequency and direction
- `uv⃗`: Texture coordinates (spatial position)
- `ωᵢt`: Temporal component for animation
- `φ₀ᵢ`: Phase offset for wave positioning

#### Wave Sharpening Transform

The key innovation is the wave sharpening function that transforms smooth sine waves into realistic, sharp-crested wave profiles:

```
sharpenWave(wave, sharpness) = mix(wave, transformed_wave, sharpness)
```

**Transformation Process:**
1. **Power Parameter**: `p = 1/(1 + sharpness × 4)`
2. **Valley Targeting**: `y₀ = -wave`
3. **Negative Space Shift**: `y₁ = y₀ - 1`
4. **Power Function**: `y₂ = -(-y₁)^(1/p)`
5. **Recentering**: `y₃ = y₂ + 1`
6. **Normalization**: `y₄ = 2(y₃ - min)/(max - min) - 1`
7. **Orientation Restore**: `y₅ = -y₄`

This creates oscilloscope-like waveforms with:
- Sharp, deep valleys (wave troughs)
- Flattened, shaped peaks (wave crests)
- Realistic wave asymmetry

#### Seamless Tiling Mathematics

For seamless texture tiling, wave vectors are quantized to ensure integer wave cycles:

```
kₓ = round(fᵢ × dₓ) × 2π
kᵧ = round(fᵢ × dᵧ) × 2π
```

This guarantees that waves complete exact integer cycles across the [0,1] texture space, eliminating seams when tiling.

### 🔍 Normal Map Generation

#### Analytical Derivatives

Normal vectors are calculated using analytical derivatives rather than finite differences for maximum precision:

```
∂H/∂x = Σᵢ Aᵢ × sharpenDerivative(cos(φᵢ), sᵢ) × kₓᵢ
∂H/∂y = Σᵢ Aᵢ × sharpenDerivative(cos(φᵢ), sᵢ) × kᵧᵢ
```

#### Surface Normal Calculation

The surface normal is computed from the gradient:

```
n⃗ = normalize((-∂H/∂x × intensity, -∂H/∂y × intensity, 1))
```

Output in normal map format: `n⃗ × 0.5 + 0.5` (maps [-1,1] to [0,1])

### ⚙️ Advanced Features

#### Height Normalization

Optional normalization ensures full dynamic range usage:

```
H_normalized = 2 × (H - H_min)/(H_max - H_min) - 1
```

Where theoretical bounds are:
- `H_min = -Σᵢ |Aᵢ|` (all waves in destructive interference)
- `H_max = +Σᵢ |Aᵢ|` (all waves in constructive interference)

#### Temporal Animation

Smooth looping animation is achieved through:

```
t_normalized = (t mod loop_duration) / loop_duration
```

With integer temporal frequencies ensuring perfect loops.

#### Gradient Normalization

Optional gradient normalization for consistent normal intensity:

```
gradient_normalized = (gradient / |gradient|) × scale
```

### 🌍 Physical Interpretation

The mathematical model approximates real ocean wave behavior:

- **Dispersion**: Different frequency components travel at different speeds
- **Superposition**: Multiple wave trains combine linearly
- **Directional Spreading**: Waves propagate in various directions
- **Nonlinear Effects**: Wave sharpening simulates wave steepening and breaking
- **Statistical Properties**: Fourier synthesis matches observed ocean spectra

### 💻 Implementation Notes

#### Numerical Stability

- Careful handling of division by zero in normalization
- Clamping of output values to valid ranges
- Robust handling of edge cases in power functions

#### Performance Optimization

- Analytical derivatives eliminate sampling overhead
- Efficient loop unrolling for fixed layer counts
- Optimized trigonometric function usage

#### Precision Considerations

- High-precision floating point for temporal consistency
- Careful phase accumulation to prevent drift
- Quantization strategies for seamless tiling

This mathematical foundation enables the generation of highly realistic, animatable wave patterns suitable for real-time rendering applications while maintaining computational efficiency and visual quality.

## 📁 Preset System

### Exporting Presets
```javascript
// Preset format example
{
  "version": "1.0",
  "name": "Ocean Waves",
  "settings": {
    "loopDuration": 2.0,
    "speed": 1.0,
    "layerCount": 4,
    "outputMode": "normal",
    "waveScale": 1.0,
    "normalIntensity": 1.0,
    "heightRange": 1.0,
    "waveLayers": [
      {
        "amplitude": 0.8,
        "spatialFreq": 0.5,
        "temporalFreq": 1,
        "direction": { "x": 1.0, "y": 0.0 },
        "phase": 0.0,
        "sharpness": 0.2
      }
    ]
  }
}
```

### Importing Presets
1. Click "📁 Import Preset"
2. Select your JSON preset file
3. Settings will be automatically applied
4. Preset is saved to local storage

## 🎯 Use Cases

### Game Development
- **Ocean Surfaces**: Realistic water for open-world games
- **Lake Effects**: Calm water with gentle ripples
- **River Systems**: Flowing water with directional waves

### Digital Art
- **Procedural Textures**: Generate unique wave patterns
- **Material Design**: Create custom water materials

## 🔧 Technical Details

### Rendering Pipeline
- **WebGL 2.0**: Primary rendering with fallback to WebGL 1.0
- **Fragment Shaders**: GPU-accelerated wave computation
- **Real-time Updates**: 60 FPS animation with live parameter changes

### Mathematical Foundation
- **Fourier Synthesis**: Sum of sinusoidal wave components
- **Seamless Tiling**: Quantized spatial frequencies
- **Perfect Looping**: Integer temporal frequencies
- **Wave Sharpening**: Mathematical transformation for realistic shapes

### Browser Compatibility

| Browser | Version | WebGL Support |
|---------|---------|---------------|
| Chrome | 51+ | ✅ Full |
| Firefox | 51+ | ✅ Full |
| Safari | 10+ | ✅ Full |
| Edge | 79+ | ✅ Full |

### Performance Notes
- **GPU Dependent**: Real-time performance varies with graphics capabilities
- **Export Time**: Increases with resolution and frame count
- **Memory Usage**: Multiple layers impact VRAM usage
- **Mobile Support**: Limited by device GPU capabilities

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow existing JavaScript conventions
- Add comments for complex mathematical operations
- Test across different browsers
- Maintain backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebGL Community**: For GPU acceleration capabilities
- **JSZip Library**: For ZIP file generation
- **Wave Mathematics**: Fourier analysis and synthesis principles
- **Game Development Community**: For real-world use case feedback

---

**Built with WebGL, vanilla JavaScript, and lots of wave mathematics! 🌊**

*Perfect for game developers, VFX artists, educators, and anyone who loves the beauty of mathematical waves.*
