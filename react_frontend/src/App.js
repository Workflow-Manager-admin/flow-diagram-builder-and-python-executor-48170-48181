import React, { useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
/**
 * Main App component - hosts the entire flow diagram editor UI.
 * - Header
 * - Sidebar toolbox
 * - Main diagram canvas
 * - Code and output sections
 */
function App() {
  // Theme state (light/dark)
  const [theme, setTheme] = useState('light');
  // Simple diagram state: array of nodes & connections (edges)
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  // Currently selected node for Python code input
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // Map nodeId -> code text
  const [nodeCode, setNodeCode] = useState({});
  // Output/results from backend code execution
  const [output, setOutput] = useState('');
  // REST API backend base URL
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  /** Toggle between light and dark themes */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  /** Add a node of given type to the diagram */
  const handleAddNode = (type) => {
    const id = `node-${Date.now()}`;
    setNodes(nodes => [
      ...nodes,
      { id, type, label: type, x: 100 + nodes.length * 80, y: 100, }
    ]);
    setNodeCode(code => ({ ...code, [id]: "" }));
  };

  // PUBLIC_INTERFACE
  /** Select a node (to edit code) */
  const handleSelectNode = (id) => setSelectedNodeId(id);

  // PUBLIC_INTERFACE
  /** Edit Python code for a node */
  const handleCodeChange = (e) => {
    if (selectedNodeId) {
      setNodeCode(code => ({ ...code, [selectedNodeId]: e.target.value }));
    }
  };

  // PUBLIC_INTERFACE
  /** Save the diagram to backend */
  const handleSaveDiagram = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/diagram/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          code: nodeCode
        })
      });
      window.alert('Diagram saved!');
    } catch (err) {
      window.alert('Save failed');
    }
  };

  // PUBLIC_INTERFACE
  /** Load the diagram from backend */
  const handleLoadDiagram = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/diagram/load`);
      const data = await resp.json();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setNodeCode(data.code || {});
      setSelectedNodeId(null);
      setOutput('');
    } catch (err) {
      window.alert('Load failed');
    }
  };

  // PUBLIC_INTERFACE
  /** Run diagram - send to backend for execution */
  const handleRunDiagram = async () => {
    try {
      setOutput('Running...');
      const resp = await fetch(`${BACKEND_URL}/api/python/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes,
          edges,
          code: nodeCode
        })
      });
      const data = await resp.json();
      setOutput(data.output || "No output.");
    } catch (err) {
      setOutput('Execution failed.');
    }
  };

  // UI structure: header, sidebar, main, output/code
  return (
    <div className="App" style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, padding: "0 32px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)"
      }}>
        <span style={{
          fontWeight: 800, fontSize: 24, color: "var(--text-primary)", letterSpacing: 1
        }}>
          Flow Diagram Builder
        </span>
        <nav>
          <button style={navBtnStyle} onClick={handleSaveDiagram} title="Save Diagram">Save</button>
          <button style={navBtnStyle} onClick={handleLoadDiagram} title="Load Diagram">Load</button>
          <button style={navBtnStyle} onClick={handleRunDiagram} title="Run Python">Run</button>
        </nav>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{ marginLeft: 16}}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Sidebar (Toolbox) */}
        <aside style={{
          background: "var(--bg-secondary)", width: 160, borderRight: "1px solid var(--border-color)",
          padding: 0, display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <h3 style={{ margin: "32px 0 8px 0", color: "var(--text-primary)", fontWeight: 600, fontSize: 16, letterSpacing: ".1em"}}>
            Toolbox
          </h3>
          <ToolboxButton label="Process" onClick={() => handleAddNode("Process")} />
          <ToolboxButton label="Input" onClick={() => handleAddNode("Input")} />
          <ToolboxButton label="Output" onClick={() => handleAddNode("Output")} />
        </aside>
        {/* Main canvas area */}
        <main style={{
          flex: 1,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "var(--bg-primary)",
          minWidth: 0,
          position: "relative"
        }}>
          {/* Mini-canvas: simple SVG node + edge */}
          <DiagramCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            style={{
              flex: 1,
              minHeight: 0,
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-color)"
            }}
          />
          {/* Code & Output section */}
          <div style={{
            display: "flex", flexDirection: "row", borderTop: "1px solid var(--border-color)", height: 220, background: "var(--bg-primary)"
          }}>
            {/* Code editor */}
            <div style={{ flex: 1, padding: 24 }}>
              <div style={{ fontSize: 14, marginBottom: 4, color: "var(--text-primary)" }}>
                {selectedNodeId ? `Edit Python Code for ${nodes.find(n=>n.id===selectedNodeId)?.label}` : 'Select a node to edit its Python code'}
              </div>
              <textarea
                value={selectedNodeId ? nodeCode[selectedNodeId] || "" : ""}
                onChange={handleCodeChange}
                disabled={!selectedNodeId}
                style={{
                  width: "100%", height: 130, fontFamily: "monospace", fontSize: 14,
                  background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)",
                  resize: "vertical", borderRadius: 4, padding: 8
                }}
                placeholder="Write Python code for this node..."
              />
            </div>
            {/* Output display */}
            <div style={{
              flex: 1,
              padding: 24,
              borderLeft: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column"
            }}>
              <div style={{ fontSize: 14, marginBottom: 4, color: "var(--text-primary)" }}>Execution Output</div>
              <pre style={{
                flex: 1, background: "#16161D", color: "#E8D7A7", fontFamily: "monospace",
                fontSize: 13, whiteSpace: "pre-wrap", borderRadius: 4, padding: 8,
                margin: 0, overflowX: "auto"
              }}>
                {output}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Toolbox Button component
function ToolboxButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "110px",
        padding: "10px 16px",
        fontSize: 15,
        fontWeight: 500,
        margin: "12px 0",
        background: "var(--button-bg)",
        color: "var(--button-text)",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        transition: "background .2s, transform .15s, box-shadow .15s",
        boxShadow: "0 1px 4px rgba(0,0,0,.04), 0 0 0 0 rgba(0,0,0,0)"
      }}
      tabIndex={0}
    >
      {label}
    </button>
  );
}

// Minimal diagram canvas with draggable nodes
function DiagramCanvas({ nodes, edges, selectedNodeId, onSelectNode, style }) {
  // Local dragging state (in-memory, not persisted)
  const [dragging, setDragging] = useState(null);

  const handleMouseDown = (e, id) => {
    setDragging({ id, offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const svg = e.target.ownerSVGElement;
    if (!svg) return;
    // Get mouse position relative to SVG
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left - (dragging.offsetX || 0);
    const y = e.clientY - rect.top - (dragging.offsetY || 0);
    // Clamp position to canvas
    updateNodePos(dragging.id, Math.max(0, Math.min(x, 1024)), Math.max(0, Math.min(y, 512)));
  };

  // Helper to update node position (local only)
  const updateNodePos = (id, x, y) => {
    setDragging(dragging => ({
      ...dragging,
      lastX: x,
      lastY: y
    }));
    // Actually update via onDragEnd
    setNodesCurrent(nodesCurr =>
      nodesCurr.map(n => n.id === id ? { ...n, x, y } : n)
    );
  };

  // Use a local setState clone for position update; ref callback to parent
  const [nodesCurrent, setNodesCurrent] = useState(nodes);
  useEffect(() => { setNodesCurrent(nodes); }, [nodes]);
  useEffect(() => { if (!dragging) setNodesCurrent(nodes); }, [dragging, nodes]);

  // Only commit on mouse up if node actually was dragged
  const handleMouseUpSVG = () => {
    setDragging(null);
    // Commit only if changed
    if (dragging && (dragging.lastX != null && dragging.lastY != null)) {
      onNodeMoveCommit(dragging.id, dragging.lastX, dragging.lastY);
    }
  };
  const onNodeMoveCommit = (nodeId, x, y) => {
    // Update parent's node state
    setNodesCurrent(nc => nc.map(n => n.id === nodeId ? { ...n, x, y } : n));
    // Push up change event; in parent, this will update setNodes
    // This callback will have to be lifted up to parent for persistence support if required.
  };

  // Expose drag events at SVG root
  return (
    <svg
      width="100%" height="100%"
      viewBox="0 0 1024 512"
      style={Object.assign({ background: "#FCFCFD", minHeight: 320, width: "100%", cursor: dragging ? "grabbing" : "pointer" }, style)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpSVG}
      tabIndex={0}
      aria-label="Diagram Canvas"
    >
      {/* Render edges (future; as lines if needed) */}
      {
        edges.map((edge, i) => {
          const src = nodes.find(n => n.id === edge.source);
          const tgt = nodes.find(n => n.id === edge.target);
          if (!src || !tgt) return null;
          return (
            <line
              key={i}
              x1={src.x + 50}
              y1={src.y + 25}
              x2={tgt.x + 50}
              y2={tgt.y + 25}
              stroke="#C3C3D1"
              strokeWidth="2"
            />
          );
        })
      }
      {/* Render nodes */}
      {
        nodes.map((node) => (
          <g
            key={node.id}
            tabIndex={0}
            style={{ cursor: "grab" }}
            onMouseDown={e => handleMouseDown(e, node.id)}
            onClick={() => onSelectNode(node.id)}
          >
            {/* Node box */}
            <rect
              x={node.x}
              y={node.y}
              width="100"
              height="50"
              rx="10"
              fill={selectedNodeId === node.id ? "#1e88e5" : "#3949ab"}
              stroke={selectedNodeId === node.id ? "#43a047" : "#222"}
              strokeWidth={selectedNodeId === node.id ? 4 : 2}
            />
            {/* Node label */}
            <text
              x={node.x + 50}
              y={node.y + 28}
              textAnchor="middle"
              fontFamily="inherit"
              fontSize="15"
              fill="#FFF"
              style={{ userSelect: "none", pointerEvents: "none", fontWeight: 600 }}
              alignmentBaseline="central"
            >
              {node.label}
            </text>
          </g>
        ))
      }
      {/* Optional: Hint */}
      {nodes.length === 0 && <text x={512} y={256} textAnchor="middle" fill="#888" fontSize={22}>Add nodes from the toolbox to get started</text>}
    </svg>
  );
}

// Inline nav button style
const navBtnStyle = {
  fontWeight: 600,
  fontSize: 15,
  marginLeft: 8,
  marginRight: 4,
  borderRadius: 7,
  padding: "8px 18px",
  background: "var(--button-bg)",
  color: "var(--button-text)",
  border: "none",
  cursor: "pointer",
  transition: "all .16s",
};

export default App;
