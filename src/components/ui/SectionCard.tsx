import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SectionCard({ title, description, children }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description ? <p className="text-sm text-gray-600 mt-1">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

