import React, { useState, useEffect, useRef } from 'react';
import { useDataset } from '../context/DatasetContext';
import PageContainer from '../components/layout/PageContainer';
import { api } from '../services/api';
import { 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Maximize2,
  Search,
  Tag,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import '../styles/visualize.css';

export default function Visualize() {
  const { setActiveTab, zipUploaded, jsonUploaded } = useDataset();

  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState(null);

  const [selectedImgId, setSelectedImgId] = useState(null);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [currentImgData, setCurrentImgData] = useState(null);
  const [currentImgLoading, setCurrentImgLoading] = useState(false);

  // Filter toolbar states
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [showLabels, setShowLabels] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showOBB, setShowOBB] = useState(false);

  // Interactive annotation highlight
  const [hoveredAnnId, setHoveredAnnId] = useState(null);
  const [selectedAnnId, setSelectedAnnId] = useState(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Zoom scale
  const [zoomScale, setZoomScale] = useState(1);

  // Unique categories list
  const [categories, setCategories] = useState([]);

  // Fetch image list manifest
  useEffect(() => {
    const loadImagesList = async () => {
      if (!zipUploaded || !jsonUploaded) return;
      setImagesLoading(true);
      setImagesError(null);
      try {
        const res = await api.getImages();
        const imgs = res.images || [];
        setImages(imgs);
        if (imgs.length > 0) {
          setSelectedImgId(imgs[0].id);
          setSelectedImgIdx(0);
        }
      } catch (err) {
        setImagesError(err.message || 'Failed to load images.');
      } finally {
        setImagesLoading(false);
      }
    };
    loadImagesList();
  }, [zipUploaded, jsonUploaded]);

  // Fetch current image annotations
  useEffect(() => {
    const loadAnnotations = async () => {
      if (selectedImgId === null) return;
      setCurrentImgLoading(true);
      try {
        const data = await api.getAnnotations(selectedImgId);
        setCurrentImgData(data);
        
        // Extract categories present on image
        const cats = Array.from(new Set(data.annotations.map(a => a.class_name)));
        setCategories(cats);
        setSelectedAnnId(null);
      } catch (err) {
        console.error("Failed to load annotations for image", selectedImgId, err);
      } finally {
        setCurrentImgLoading(false);
      }
    };
    loadAnnotations();
  }, [selectedImgId]);

  // Navigate to index
  const selectImageByIndex = (idx) => {
    if (idx < 0 || idx >= filteredImages.length) return;
    const img = filteredImages[idx];
    setSelectedImgId(img.id);
    // Find index in main list
    const mainIdx = images.findIndex(i => i.id === img.id);
    setSelectedImgIdx(mainIdx);
    setZoomScale(1);
  };

  const handleNext = () => {
    const curIndexInFiltered = filteredImages.findIndex(i => i.id === selectedImgId);
    if (curIndexInFiltered < filteredImages.length - 1) {
      selectImageByIndex(curIndexInFiltered + 1);
    }
  };

  const handlePrev = () => {
    const curIndexInFiltered = filteredImages.findIndex(i => i.id === selectedImgId);
    if (curIndexInFiltered > 0) {
      selectImageByIndex(curIndexInFiltered - 1);
    }
  };

  // Zoom operations
  const zoomIn = () => setZoomScale(prev => Math.min(prev + 0.15, 3));
  const zoomOut = () => setZoomScale(prev => Math.max(prev - 0.15, 0.5));
  const resetZoom = () => setZoomScale(1);

  // Filter image lists by search query
  const filteredImages = images.filter(img => 
    img.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered annotations in current image
  const getFilteredAnnotations = () => {
    if (!currentImgData) return [];
    return currentImgData.annotations.filter(ann => 
      selectedClassFilter === 'All' || ann.class_name === selectedClassFilter
    );
  };

  const activeAnnotations = getFilteredAnnotations();
  const currentImageInfo = currentImgData || {};
  const currentImageWidth = currentImageInfo.width || 800;
  const currentImageHeight = currentImageInfo.height || 600;

  if (imagesLoading) {
    return (
      <PageContainer>
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', gap: '16px' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading images manifest...</p>
        </div>
      </PageContainer>
    );
  }

  if (imagesError || images.length === 0) {
    return (
      <PageContainer>
        <div style={{ height: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', gap: '16px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)' }} />
          <h3>No Images Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Please upload a valid ZIP containing dataset images.</p>
          <button className="btn-primary" onClick={() => setActiveTab('upload')}>
            <span>Go to Upload</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Visualizer header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'var(--font-headings)' }}>
            Visualization
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Browse and visualize annotations on image frames
          </p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Top filter toolbar */}
      <div className="glass-panel filters-toolbar">
        <div className="filters-left">
          {/* Class selection filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Class:</span>
            <select 
              className="filter-select"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              <option value="All">All Classes</option>
              {categories.map((c, idx) => (
                <option key={idx} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Toggle buttons */}
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showLabels} 
              onChange={(e) => setShowLabels(e.target.checked)} 
            />
            <span>Show Labels</span>
          </label>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showBoxes} 
              onChange={(e) => setShowBoxes(e.target.checked)} 
            />
            <span>Show Boxes</span>
          </label>
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={showOBB} 
              onChange={(e) => setShowOBB(e.target.checked)} 
            />
            <span>Show OBB</span>
          </label>
        </div>

        {/* Selected image navigation count */}
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Image ID: <strong style={{ color: 'var(--text-primary)' }}>{selectedImgId}</strong>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="visualizer-workspace">
        
        {/* Left Side: Thumbnail Panel */}
        <div className="thumbnail-list">
          <div className="thumbnail-search">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search images..." 
                className="settings-input"
                style={{ paddingLeft: '32px', paddingRight: '12px', fontSize: '12px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <div className="thumbnail-scroll">
            {filteredImages.map((img, idx) => {
              const isActive = img.id === selectedImgId;
              return (
                <div 
                  key={img.id}
                  className={`thumbnail-item ${isActive ? 'active' : ''}`}
                  onClick={() => selectImageByIndex(idx)}
                >
                  <span className="thumbnail-name" title={img.file_name}>{img.file_name}</span>
                  <span className="thumbnail-dims">{img.width} x {img.height}</span>
                </div>
              );
            })}
            {filteredImages.length === 0 && (
              <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
                No matches
              </div>
            )}
          </div>
        </div>

        {/* Center: Image Canvas Viewer */}
        <div className="image-viewer-container">
          
          {/* Viewer Header */}
          <div className="viewer-header">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="zoom-btn" 
                style={{ width: '28px', height: '28px', border: 'none', background: 'var(--bg-tertiary)' }}
                onClick={handlePrev}
                disabled={filteredImages.findIndex(i => i.id === selectedImgId) <= 0}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="zoom-btn" 
                style={{ width: '28px', height: '28px', border: 'none', background: 'var(--bg-tertiary)' }}
                onClick={handleNext}
                disabled={filteredImages.findIndex(i => i.id === selectedImgId) >= filteredImages.length - 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>
                {(filteredImages.findIndex(i => i.id === selectedImgId) + 1).toLocaleString()}
              </strong> / {filteredImages.length.toLocaleString()}
            </div>
            <div style={{ width: '50px' }}></div> {/* Spacer */}
          </div>

          {/* Canvas Overlay Display */}
          <div className="viewer-canvas-area">
            {currentImgLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Loading annotations overlay...</span>
              </div>
            ) : (
              <div 
                className="viewer-image-wrapper"
                style={{
                  transform: `scale(${zoomScale})`,
                  transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Main Raw Image served from Flask */}
                <img 
                  src={api.getImageUrl(selectedImgId)}
                  alt={currentImageInfo.file_name} 
                  className="viewer-image"
                />

                {/* SVG Annotation Drawing Layer */}
                <svg 
                  className="viewer-svg-overlay"
                  viewBox={`0 0 ${currentImageWidth} ${currentImageHeight}`}
                  preserveAspectRatio="none"
                >
                  {activeAnnotations.map((ann) => {
                    const isHovered = ann.annotation_id === hoveredAnnId;
                    const isSelected = ann.annotation_id === selectedAnnId;
                    const strokeColor = ann.class_idx % 2 === 0 ? 'var(--primary)' : 'var(--purple)';
                    const colorVal = isSelected ? 'var(--success)' : (isHovered ? 'var(--info)' : strokeColor);
                    
                    const cocoBox = ann.bbox_coco;
                    const obbCorners = ann.obb_corners;
                    
                    return (
                      <g key={ann.annotation_id}>
                        {/* 1. Axis-Aligned Rectangle Box (COCO / YOLO) */}
                        {showBoxes && cocoBox && cocoBox.length === 4 && (
                          <g>
                            <rect
                              x={cocoBox[0]}
                              y={cocoBox[1]}
                              width={cocoBox[2]}
                              height={cocoBox[3]}
                              fill="none"
                              stroke={colorVal}
                              strokeWidth={isHovered || isSelected ? '2.5' : '1.5'}
                              className="annotation-shape"
                              onMouseEnter={() => setHoveredAnnId(ann.annotation_id)}
                              onMouseLeave={() => setHoveredAnnId(null)}
                              onClick={() => setSelectedAnnId(ann.annotation_id)}
                            />
                            {showLabels && (
                              <g>
                                <rect 
                                  x={cocoBox[0]} 
                                  y={cocoBox[1] - 18} 
                                  width={Math.min(cocoBox[2], 120)} 
                                  height={18} 
                                  fill={colorVal}
                                />
                                <text
                                  x={cocoBox[0] + 5}
                                  y={cocoBox[1] - 5}
                                  className="annotation-label-badge"
                                >
                                  {ann.class_name}
                                </text>
                              </g>
                            )}
                          </g>
                        )}

                        {/* 2. Oriented Bounding Box (OBB Polygon) */}
                        {showOBB && obbCorners && obbCorners.length === 4 && (
                          <g>
                            {(() => {
                              // De-normalize coordinates
                              const pointsStr = obbCorners.map(c => 
                                `${c[0] * currentImageWidth},${c[1] * currentImageHeight}`
                              ).join(' ');
                              
                              const polyX1 = obbCorners[0][0] * currentImageWidth;
                              const polyY1 = obbCorners[0][1] * currentImageHeight;
                              
                              return (
                                <g>
                                  <polygon
                                    points={pointsStr}
                                    fill="rgba(139, 92, 246, 0.08)"
                                    stroke={colorVal}
                                    strokeWidth={isHovered || isSelected ? '2.5' : '1.5'}
                                    className="annotation-shape"
                                    onMouseEnter={() => setHoveredAnnId(ann.annotation_id)}
                                    onMouseLeave={() => setHoveredAnnId(null)}
                                    onClick={() => setSelectedAnnId(ann.annotation_id)}
                                  />
                                  {showLabels && (
                                    <g>
                                      <rect 
                                        x={polyX1} 
                                        y={polyY1 - 18} 
                                        width={100} 
                                        height={18} 
                                        fill={colorVal}
                                      />
                                      <text
                                        x={polyX1 + 5}
                                        y={polyY1 - 5}
                                        className="annotation-label-badge"
                                      >
                                        {ann.class_name}
                                      </text>
                                    </g>
                                  )}
                                </g>
                              );
                            })()}
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Zoom Buttons Controls Bottom Right */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={zoomIn} title="Zoom In">
              <Plus size={16} />
            </button>
            <button className="zoom-btn" onClick={zoomOut} title="Zoom Out">
              <Minus size={16} />
            </button>
            <button className="zoom-btn" onClick={resetZoom} title="Reset Zoom">
              <Maximize2 size={15} />
            </button>
          </div>
        </div>

        {/* Right Side: Annotation Details List */}
        <div className="details-panel">
          <h4 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={16} />
            <span>Annotation Details</span>
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeAnnotations.map((ann) => {
              const isHovered = ann.annotation_id === hoveredAnnId;
              const isSelected = ann.annotation_id === selectedAnnId;
              const cardClass = isSelected ? 'selected' : '';
              
              const bboxYolo = ann.bbox_yolo || [0, 0, 0, 0];
              const badgeBg = ann.class_idx % 2 === 0 ? 'var(--primary-glow)' : 'var(--purple-glow)';
              const badgeColor = ann.class_idx % 2 === 0 ? 'var(--primary)' : 'var(--purple)';

              return (
                <div 
                  key={ann.annotation_id}
                  className={`details-card ${cardClass}`}
                  style={{
                    borderColor: isHovered ? 'var(--info)' : (isSelected ? 'var(--success)' : 'var(--border-color)')
                  }}
                  onMouseEnter={() => setHoveredAnnId(ann.annotation_id)}
                  onMouseLeave={() => setHoveredAnnId(null)}
                  onClick={() => setSelectedAnnId(ann.annotation_id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span 
                      className="details-badge" 
                      style={{ background: badgeBg, color: badgeColor }}
                    >
                      {ann.class_name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ID: {ann.annotation_id}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px' }}>
                    <div>x: <strong style={{ color: 'var(--text-primary)' }}>{bboxYolo[0].toFixed(4)}</strong></div>
                    <div>y: <strong style={{ color: 'var(--text-primary)' }}>{bboxYolo[1].toFixed(4)}</strong></div>
                    <div>w: <strong style={{ color: 'var(--text-primary)' }}>{bboxYolo[2].toFixed(4)}</strong></div>
                    <div>h: <strong style={{ color: 'var(--text-primary)' }}>{bboxYolo[3].toFixed(4)}</strong></div>
                  </div>
                  
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
                    Image Frame Size: {currentImageWidth} x {currentImageHeight}
                  </div>
                </div>
              );
            })}
            
            {activeAnnotations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                No annotations in this category for the current frame.
              </div>
            )}
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
