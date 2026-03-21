interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}

export default ErrorMessage;
