import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-gray-600 mt-2 max-w-3xl">{subtitle}</p> : null}
        </div>
        {right ? <div className="w-full md:w-auto">{right}</div> : null}
      </div>
    </div>
  );
}

