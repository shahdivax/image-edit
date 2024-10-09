import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  Crop,
  RotateCcw,
  Download,
  Sun,
  Moon,
  Image as ImageIcon,
  Contrast,
  Droplet,
  Palette,
  Scissors,
  FlipHorizontal,
  FlipVertical,
  Aperture,
  Square,
  Circle,
  Triangle,
  Highlighter,
  Pen,
} from 'lucide-react';

function ImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
  });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('adjust');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawSize, setDrawSize] = useState(5);
  const [drawTool, setDrawTool] = useState('pen');
  const [highlighterOpacity, setHighlighterOpacity] = useState(0.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        // Set canvas size based on the image size
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
        }
        resetCanvas();
      };
      img.src = image;
    }
  }, [image]);

  useEffect(() => {
    if (imageRef.current) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, crop]);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image with filters applied
    applyFilters();
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !imageRef.current) return;

    // Clear the canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      hue-rotate(${filters.hue}deg)
      blur(${filters.blur}px)
    `;

    // Source coordinates and dimensions
    const sx = crop.x;
    const sy = crop.y;
    const sWidth = crop.width || imageRef.current.width;
    const sHeight = crop.height || imageRef.current.height;

    // Destination dimensions
    const dWidth = canvas.width;
    const dHeight = canvas.height;

    ctx.drawImage(
      imageRef.current,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      dWidth,
      dHeight
    );

    // Apply sharpening if necessary
    if (filters.sharpen > 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sharpenedData = applySharpen(imageData, filters.sharpen);
      ctx.putImageData(sharpenedData, 0, 0);
    }
  };

  const applySharpen = (imageData: ImageData, amount: number) => {
    const w = imageData.width;
    const h = imageData.height;
    const data = imageData.data;
    const factor = amount / 10;
    const kernel = [
      [0, -factor, 0],
      [-factor, 1 + 4 * factor, -factor],
      [0, -factor, 0],
    ];

    const result = new ImageData(w, h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * w + (x + kx)) * 4 + c;
              sum += data[idx] * kernel[ky + 1][kx + 1];
            }
          }
          const idx = (y * w + x) * 4 + c;
          result.data[idx] = Math.max(0, Math.min(255, sum));
        }
        result.data[(y * w + x) * 4 + 3] = data[(y * w + x) * 4 + 3];
      }
    }
    return result;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFilterChange = (filter: string, value: number) => {
    setFilters((prev) => ({ ...prev, [filter]: value }));
  };

  const handleCropChange = (key: string, value: number) => {
    setCrop((prev) => ({
      ...prev,
      [key]: Math.max(
        0,
        Math.min(
          value,
          key === 'width'
            ? imageRef.current?.width || 0
            : imageRef.current?.height || 0
        )
      ),
    }));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'edited_image.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleReset = () => {
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sharpen: 0,
    });
    setCrop({ x: 0, y: 0, width: 0, height: 0 });
    resetCanvas();
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode((prev) => !prev);
  };

  const getScale = () => {
    if (!imageRef.current || !canvasRef.current) return { scaleX: 1, scaleY: 1 };
    return {
      scaleX:
        canvasRef.current.width /
        (crop.width || imageRef.current.width),
      scaleY:
        canvasRef.current.height /
        (crop.height || imageRef.current.height),
    };
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const { scaleX, scaleY } = getScale();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      drawStartRef.current = { x, y };
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
      ctx?.moveTo(x, y);
    }
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawSize;
      ctx.lineCap = 'round';

      if (drawTool === 'highlighter') {
        ctx.globalAlpha = highlighterOpacity;
        ctx.lineWidth = drawSize * 2;
      } else {
        ctx.globalAlpha = 1;
      }

      if (['pen', 'highlighter'].includes(drawTool)) {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (['square', 'circle', 'triangle'].includes(drawTool)) {
        // Redraw image and existing drawings
        resetCanvas();

        // Redraw existing drawings (if you implement a drawing history)
        // ...

        drawShape(ctx, drawTool, drawStartRef.current!.x, drawStartRef.current!.y, x, y);
      }
    }
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
    drawStartRef.current = null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
    }
  };

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1;

    ctx.beginPath();
    switch (shape) {
      case 'square':
        ctx.rect(startX, startY, endX - startX, endY - startY);
        break;
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        break;
      case 'triangle':
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX - (endX - startX), endY);
        ctx.closePath();
        break;
    }
    ctx.stroke();
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.save();
      if (direction === 'horizontal') {
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
      } else {
        ctx.scale(1, -1);
        ctx.translate(0, -canvas.height);
      }
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    }
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div className="container mx-auto p-4">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Advanced Image Editor
        </h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                onMouseDown={handleDrawStart}
                onMouseMove={handleDraw}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
              />
            </div>
            <div className="flex justify-between mb-4">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="inline-block mr-2" />
                Upload Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                onClick={handleSave}
              >
                <Download className="inline-block mr-2" />
                Save Image
              </button>
            </div>
          </div>
          <div className="lg:w-1/3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className="flex mb-4">
                <button
                  className={`flex-1 py-2 px-4 ${
                    activeTab === 'adjust'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  } rounded-l`}
                  onClick={() => setActiveTab('adjust')}
                >
                  <Sliders className="inline-block mr-2" />
                  Adjust
                </button>
                <button
                  className={`flex-1 py-2 px-4 ${
                    activeTab === 'crop'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setActiveTab('crop')}
                >
                  <Crop className="inline-block mr-2" />
                  Crop
                </button>
                <button
                  className={`flex-1 py-2 px-4 ${
                    activeTab === 'draw'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  } rounded-r`}
                  onClick={() => setActiveTab('draw')}
                >
                  <Palette className="inline-block mr-2" />
                  Draw
                </button>
              </div>
              {activeTab === 'adjust' && (
                <div>
                  {/* Adjust Filters */}
                  {/* Brightness */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      <Contrast className="inline-block mr-2" />
                      Brightness
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.brightness}
                      onChange={(e) =>
                        handleFilterChange('brightness', Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* Other filters... */}
                  {/* Contrast */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      <Contrast className="inline-block mr-2" />
                      Contrast
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.contrast}
                      onChange={(e) =>
                        handleFilterChange('contrast', Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* Saturation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      <Droplet className="inline-block mr-2" />
                      Saturation
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.saturation}
                      onChange={(e) =>
                        handleFilterChange('saturation', Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* Hue */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      <Palette className="inline-block mr-2" />
                      Hue
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={filters.hue}
                      onChange={(e) =>
                        handleFilterChange('hue', Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* Blur */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      <Aperture className="inline-block mr-2" />
                      Blur
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.blur}
                      onChange={(e) =>
                        handleFilterChange('blur', Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  {/* Sharpen */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      <Scissors className="inline-block mr-2" />
                      Sharpen
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.sharpen}
                      onChange={(e) =>
                        handleFilterChange('sharpen', Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
              {activeTab === 'crop' && (
                <div>
                  {/* Crop Controls */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">X</label>
                    <input
                      type="number"
                      value={crop.x}
                      onChange={(e) =>
                        handleCropChange('x', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Y</label>
                    <input
                      type="number"
                      value={crop.y}
                      onChange={(e) =>
                        handleCropChange('y', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Width
                    </label>
                    <input
                      type="number"
                      value={crop.width}
                      onChange={(e) =>
                        handleCropChange('width', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Height
                    </label>
                    <input
                      type="number"
                      value={crop.height}
                      onChange={(e) =>
                        handleCropChange('height', Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              )}
              {activeTab === 'draw' && (
                <div>
                  {/* Drawing Controls */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Tool
                    </label>
                    <div className="flex space-x-2">
                      <button
                        className={`p-2 rounded ${
                          drawTool === 'pen'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                        onClick={() => setDrawTool('pen')}
                      >
                        <Pen />
                      </button>
                      <button
                        className={`p-2 rounded ${
                          drawTool === 'highlighter'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                        onClick={() => setDrawTool('highlighter')}
                      >
                        <Highlighter />
                      </button>
                      <button
                        className={`p-2 rounded ${
                          drawTool === 'square'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                        onClick={() => setDrawTool('square')}
                      >
                        <Square />
                      </button>
                      <button
                        className={`p-2 rounded ${
                          drawTool === 'circle'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                        onClick={() => setDrawTool('circle')}
                      >
                        <Circle />
                      </button>
                      <button
                        className={`p-2 rounded ${
                          drawTool === 'triangle'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                        onClick={() => setDrawTool('triangle')}
                      >
                        <Triangle />
                      </button>
                    </div>
                  </div>
                  {/* Color Picker */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Color
                    </label>
                    <input
                      type="color"
                      value={drawColor}
                      onChange={(e) => setDrawColor(e.target.value)}
                      className="w-full h-10"
                    />
                  </div>
                  {/* Brush Size */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Size
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={drawSize}
                      onChange={(e) => setDrawSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  {/* Highlighter Opacity */}
                  {drawTool === 'highlighter' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">
                        Opacity
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={highlighterOpacity}
                        onChange={(e) =>
                          setHighlighterOpacity(Number(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between mt-4">
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                  onClick={handleReset}
                >
                  <RotateCcw className="inline-block mr-2" />
                  Reset
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                  onClick={() => handleFlip('horizontal')}
                >
                  <FlipHorizontal className="inline-block mr-2" />
                  Flip H
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                  onClick={() => handleFlip('vertical')}
                >
                  <FlipVertical className="inline-block mr-2" />
                  Flip V
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                  onClick={handleDarkModeToggle}
                >
                  {isDarkMode ? (
                    <Sun className="inline-block" />
                  ) : (
                    <Moon className="inline-block" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ImageEditor;