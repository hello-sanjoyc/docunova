interface ContentAreaProps {
  children: React.ReactNode;
}

export default function ContentArea({ children }: ContentAreaProps) {
  return <main className="px-6 py-6 md:px-8">{children}</main>;
}
