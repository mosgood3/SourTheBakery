'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaQuoteLeft, FaUndo, FaRedo } from 'react-icons/fa';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder = "Enter your content..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TextStyle,
      Color,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] p-4',
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, children, title }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg border transition-all duration-200 ${
        isActive
          ? 'bg-accent-gold text-brown border-accent-gold'
          : 'bg-white text-brown border-brown/20 hover:bg-accent-gold/10 hover:border-accent-gold'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-brown/20 rounded-xl overflow-hidden bg-white/50">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-brown/10 bg-cream/30">
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <FaBold size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <FaItalic size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <FaUnderline size={14} />
          </ToolbarButton>
        </div>
        
        <div className="w-px h-8 bg-brown/20" />
        
        <div className="flex gap-1">
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 }).run();
              }
            }}
            className="px-3 py-1 rounded-lg border border-brown/20 bg-white text-brown text-sm focus:border-accent-gold focus:outline-none"
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' : 'paragraph'
            }
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
        </div>

        <div className="w-px h-8 bg-brown/20" />

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <FaListUl size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <FaListOl size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <FaQuoteLeft size={14} />
          </ToolbarButton>
        </div>

        <div className="w-px h-8 bg-brown/20" />

        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <FaUndo size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <FaRedo size={14} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[300px]">
        <EditorContent 
          editor={editor} 
          placeholder={placeholder}
          className="focus-within:outline-none"
        />
        <style jsx global>{`
          .ProseMirror {
            outline: none;
            color: #8B4513;
            line-height: 1.6;
          }
          
          .ProseMirror p {
            margin: 0.5rem 0;
          }
          
          .ProseMirror ul {
            list-style-type: disc;
            margin-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            padding-left: 0.5rem;
          }
          
          .ProseMirror ol {
            list-style-type: decimal;
            margin-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            padding-left: 0.5rem;
          }
          
          .ProseMirror li {
            margin: 0.25rem 0;
            padding-left: 0.25rem;
          }
          
          .ProseMirror blockquote {
            border-left: 4px solid #DAA520;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            background-color: rgba(218, 165, 32, 0.1);
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
          }
          
          .ProseMirror h1 {
            font-size: 2rem;
            font-weight: bold;
            margin: 1rem 0 0.5rem 0;
            color: #8B4513;
          }
          
          .ProseMirror h2 {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0.75rem 0 0.5rem 0;
            color: #8B4513;
          }
          
          .ProseMirror h3 {
            font-size: 1.25rem;
            font-weight: bold;
            margin: 0.5rem 0 0.25rem 0;
            color: #8B4513;
          }
          
          .ProseMirror strong {
            font-weight: bold;
          }
          
          .ProseMirror em {
            font-style: italic;
          }
          
          .ProseMirror s {
            text-decoration: line-through;
          }
        `}</style>
      </div>
    </div>
  );
}