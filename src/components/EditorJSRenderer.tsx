import React from 'react';
import { OutputData, OutputBlockData } from '@editorjs/editorjs';
import ImageCarousel from '@/components/ImageCarousel';

interface EditorJSRendererProps {
  data: OutputData | string;
  className?: string;
}

const EditorJSRenderer: React.FC<EditorJSRendererProps> = ({ data, className = '' }) => {
  let parsedData: OutputData;

  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      return <div className={className}>{data}</div>;
    }
  } else {
    parsedData = data;
  }

  if (!parsedData.blocks || !Array.isArray(parsedData.blocks)) {
    return null;
  }

  const renderBlock = (block: OutputBlockData, index: number) => {
    switch (block.type) {
      case 'header':
        const HeaderTag = `h${block.data.level}` as keyof JSX.IntrinsicElements;
        const headerClasses: Record<number, string> = {
          1: 'text-4xl font-bold mb-6 mt-8',
          2: 'text-3xl font-bold mb-5 mt-7',
          3: 'text-2xl font-bold mb-4 mt-6',
          4: 'text-xl font-bold mb-3 mt-5',
          5: 'text-lg font-bold mb-2 mt-4',
          6: 'text-base font-bold mb-2 mt-3'
        };
        return (
          <HeaderTag key={index} className={headerClasses[block.data.level as number] || headerClasses[2]}>
            {block.data.text}
          </HeaderTag>
        );

      case 'paragraph':
        return (
          <p 
            key={index} 
            className="mb-4 leading-relaxed text-gray-700"
            dangerouslySetInnerHTML={{ __html: block.data.text }}
          />
        );

      case 'list':
        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const listClass = block.data.style === 'ordered' 
          ? 'list-decimal list-inside mb-4 space-y-2' 
          : 'list-disc list-inside mb-4 space-y-2';
        return (
          <ListTag key={index} className={listClass}>
            {block.data.items.map((item: string | { content: string; meta: any; items: any[] }, i: number) => {
              const content = typeof item === 'string' ? item : item.content;
              return (
                <li key={i} className="text-gray-700" dangerouslySetInnerHTML={{ __html: content }} />
              );
            })}
          </ListTag>
        );

      case 'checklist':
        return (
          <div key={index} className="mb-4 space-y-2">
            {block.data.items.map((item: { text: string; checked: boolean }, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  readOnly
                  className="mt-1 cursor-default"
                />
                <span 
                  className={`text-gray-700 ${item.checked ? 'line-through text-gray-500' : ''}`}
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </div>
            ))}
          </div>
        );

      case 'quote':
        return (
          <blockquote key={index} className="border-l-4 border-getigne-accent pl-4 py-2 mb-4 italic bg-gray-50">
            <p className="text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: block.data.text }} />
            {block.data.caption && (
              <cite className="text-sm text-gray-600 not-italic">— {block.data.caption}</cite>
            )}
          </blockquote>
        );

      case 'warning':
        return (
          <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded">
            {block.data.title && (
              <h4 className="font-bold text-yellow-800 mb-2">{block.data.title}</h4>
            )}
            <p className="text-yellow-700" dangerouslySetInnerHTML={{ __html: block.data.message }} />
          </div>
        );

      case 'code':
        return (
          <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
            <code>{block.data.code}</code>
          </pre>
        );

      case 'delimiter':
        return (
          <div key={index} className="text-center my-8">
            <span className="text-2xl text-gray-400">* * *</span>
          </div>
        );

      case 'image':
        return (
          <figure key={index} className="mb-6">
            <img
              src={block.data.file.url}
              alt={block.data.caption || ''}
              className="w-full rounded-lg"
            />
            {block.data.caption && (
              <figcaption className="text-center text-sm text-gray-600 mt-2">
                {block.data.caption}
              </figcaption>
            )}
          </figure>
        );

      case 'embed':
        return (
          <div key={index} className="mb-6">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={block.data.embed}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allowFullScreen
                title={block.data.caption || 'Embedded content'}
              />
            </div>
            {block.data.caption && (
              <p className="text-center text-sm text-gray-600 mt-2">{block.data.caption}</p>
            )}
          </div>
        );

      case 'table':
        return (
          <div key={index} className="mb-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <tbody>
                {block.data.content.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td 
                        key={cellIndex} 
                        className="border border-gray-300 px-4 py-2"
                        dangerouslySetInnerHTML={{ __html: cell }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'linkTool':
        return (
          <a
            key={index}
            href={block.data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-4">
              {block.data.meta?.image?.url && (
                <img
                  src={block.data.meta.image.url}
                  alt=""
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div>
                <h4 className="font-bold text-getigne-accent hover:underline">
                  {block.data.meta?.title || block.data.link}
                </h4>
                {block.data.meta?.description && (
                  <p className="text-sm text-gray-600 mt-1">{block.data.meta.description}</p>
                )}
              </div>
            </div>
          </a>
        );

      case 'imageCarousel':
        return (
          <ImageCarousel
            key={index}
            images={block.data.images || []}
          />
        );

      default:
        console.warn(`Unknown block type: ${block.type}`);
        return null;
    }
  };

  return (
    <div className={`rich-content ${className}`}>
      {parsedData.blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
};

export default EditorJSRenderer;



