'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Sparkles, FileText, Layout, Workflow } from 'lucide-react';

const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

type ConversionMode = 'spec' | 'wireframe' | 'diagram' | 'story';

export default function AIWhiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [mode, setMode] = useState<ConversionMode>('spec');

  async function handleGenerate() {
    if (!excalidrawAPI) return;
    
    setGenerating(true);
    setResult('');
    
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      
      // Export as PNG for Claude to analyze
      const blob = await excalidrawAPI.exportToBlob({
        mimeType: 'image/png',
        elements,
        appState,
        files: excalidrawAPI.getFiles(),
      });
      
      const base64 = await blobToBase64(blob);
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mode,
          elements: elements.map((el: any) => ({
            type: el.type,
            text: el.text || '',
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
          })),
        }),
      });
      
      const data = await res.json();
      setResult(data.result);
    } catch (error) {
      console.error('Generation failed:', error);
      setResult('Error: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold text-white">AI Whiteboard</h1>
          <span className="text-sm text-gray-400">Draw → AI analyzes → Get specs, wireframes, or diagrams</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('spec')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'spec'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Spec
            </button>
            <button
              onClick={() => setMode('wireframe')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'wireframe'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Layout className="w-4 h-4 inline mr-1" />
              Wireframe
            </button>
            <button
              onClick={() => setMode('diagram')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'diagram'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Workflow className="w-4 h-4 inline mr-1" />
              Diagram
            </button>
            <button
              onClick={() => setMode('story')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'story'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📖 Story
            </button>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={generating || !excalidrawAPI}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {generating ? (
              <>
                <Sparkles className="w-4 h-4 inline mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 inline mr-2" />
                Generate {mode === 'spec' ? 'Spec' : mode === 'wireframe' ? 'Wireframe' : mode === 'diagram' ? 'Diagram' : 'User Story'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Excalidraw canvas */}
        <div className={`${result ? 'w-1/2' : 'w-full'} transition-all`}>
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            theme="dark"
          />
        </div>

        {/* Results panel */}
        {result && (
          <div className="w-1/2 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white mb-4">
                {mode === 'spec' && '📋 Functional Specification'}
                {mode === 'wireframe' && '🎨 Wireframe Analysis'}
                {mode === 'diagram' && '🔄 Diagram Documentation'}
                {mode === 'story' && '📖 User Stories'}
              </h2>
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
