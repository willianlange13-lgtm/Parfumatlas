/** Cookie que marca "não manter conectado": a sessão acaba quando o navegador fecha. */
export const SESSAO_CURTA = "atlas-sessao-curta";

export function semValidade<T extends { maxAge?: number; expires?: Date | number }>(o: T): T {
  const { maxAge: _m, expires: _e, ...resto } = o ?? ({} as T);
  void _m; void _e;
  return resto as T;
}
