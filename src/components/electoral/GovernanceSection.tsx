import EditorJSRenderer from '@/components/EditorJSRenderer';
import type { OutputData } from '@editorjs/editorjs';

interface GovernanceSectionProps {
  content: OutputData | null;
}

const GovernanceSection = ({ content }: GovernanceSectionProps) => {
  if (!content) return null;

  return (
    <section id="gouvernance" className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <span className="bg-getigne-accent/10 text-getigne-accent font-medium px-4 py-1 rounded-full text-sm">
            Notre fonctionnement
          </span>
          <h2 className="text-4xl font-bold mt-4 mb-6">
            Une gouvernance partagée
          </h2>
        </div>

        <div className="prose prose-lg max-w-none">
          <EditorJSRenderer data={content} />
        </div>
      </div>
    </section>
  );
};

export default GovernanceSection;






