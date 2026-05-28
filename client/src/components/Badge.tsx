interface BadgeProps {
  texto: string;
  cor?: 'verde' | 'vermelho' | 'azul' | 'cinza' | 'amarelo';
}

const cores = {
  verde: 'bg-green-100 text-green-800',
  vermelho: 'bg-red-100 text-red-800',
  azul: 'bg-blue-100 text-blue-800',
  cinza: 'bg-gray-100 text-gray-700',
  amarelo: 'bg-yellow-100 text-yellow-800',
};

export function Badge({ texto, cor = 'cinza' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cores[cor]}`}>
      {texto}
    </span>
  );
}
