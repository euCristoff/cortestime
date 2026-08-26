/**
 * Utilitário universal para extrair e formatar o endereço da barbearia / vitrine
 * Suporta formatos: string simples, objeto com cep/rua/numero/bairro/cidade/estado, ou onboardingData.
 */
export function extractAddressString(source: any): string {
  if (!source) return '';

  // 1. Se for string direta
  if (typeof source === 'string' && source.trim()) {
    return source.trim();
  }

  // 2. Se for um objeto com vitrineLocalizacao
  if (typeof source.vitrineLocalizacao === 'string' && source.vitrineLocalizacao.trim()) {
    return source.vitrineLocalizacao.trim();
  }

  // 3. Se for um objeto com vitrineEndereco do tipo string
  if (typeof source.vitrineEndereco === 'string' && source.vitrineEndereco.trim()) {
    return source.vitrineEndereco.trim();
  }

  // 4. Se vitrineEndereco for um objeto { rua, numero, bairro, cidade, estado }
  if (typeof source.vitrineEndereco === 'object' && source.vitrineEndereco !== null) {
    const { rua, numero, bairro, cidade, estado } = source.vitrineEndereco;
    const parts: string[] = [];
    if (rua) {
      parts.push(numero ? `${rua}, ${numero}` : rua);
    }
    if (bairro) parts.push(bairro);
    if (cidade) parts.push(estado ? `${cidade}/${estado}` : cidade);
    if (parts.length > 0) return parts.join(' - ');
  }

  // 5. Se endereco for uma string
  if (typeof source.endereco === 'string' && source.endereco.trim()) {
    return source.endereco.trim();
  }

  // 6. Se endereco for um objeto
  if (typeof source.endereco === 'object' && source.endereco !== null) {
    const { rua, numero, bairro, cidade, estado } = source.endereco;
    const parts: string[] = [];
    if (rua) {
      parts.push(numero ? `${rua}, ${numero}` : rua);
    }
    if (bairro) parts.push(bairro);
    if (cidade) parts.push(estado ? `${cidade}/${estado}` : cidade);
    if (parts.length > 0) return parts.join(' - ');
  }

  // 7. Se existir onboardingData
  if (source.onboardingData) {
    const { street, number, neighborhood, city, state } = source.onboardingData;
    const parts: string[] = [];
    if (street) parts.push(number ? `${street}, ${number}` : street);
    if (neighborhood) parts.push(neighborhood);
    if (city) parts.push(state ? `${city}/${state}` : city);
    if (parts.length > 0) return parts.join(' - ');
  }

  // 8. Se os campos estiverem no nível raiz (rua, numero, etc.)
  if (source.rua || source.street) {
    const rua = source.rua || source.street;
    const numero = source.numero || source.number;
    const bairro = source.bairro || source.neighborhood;
    const cidade = source.cidade || source.city;
    const estado = source.estado || source.state;
    const parts: string[] = [];
    if (rua) parts.push(numero ? `${rua}, ${numero}` : rua);
    if (bairro) parts.push(bairro);
    if (cidade) parts.push(estado ? `${cidade}/${estado}` : cidade);
    if (parts.length > 0) return parts.join(' - ');
  }

  return '';
}

export function parseAddressComponents(source: any, defaultOnboarding?: any) {
  let cep = defaultOnboarding?.cep || '';
  let rua = defaultOnboarding?.street || '';
  let numero = defaultOnboarding?.number || '';
  let bairro = defaultOnboarding?.neighborhood || '';
  let cidade = defaultOnboarding?.city || '';
  let estado = defaultOnboarding?.state || '';

  if (!source) {
    return { cep, rua, numero, bairro, cidade, estado };
  }

  // If vitrineEndereco is an object
  if (typeof source.vitrineEndereco === 'object' && source.vitrineEndereco !== null) {
    const v = source.vitrineEndereco;
    if (v.cep) cep = v.cep;
    if (v.rua) rua = v.rua;
    if (v.numero) numero = v.numero;
    if (v.bairro) bairro = v.bairro;
    if (v.cidade) cidade = v.cidade;
    if (v.estado) estado = v.estado;
    return { cep, rua, numero, bairro, cidade, estado };
  }

  // If endereco is an object
  if (typeof source.endereco === 'object' && source.endereco !== null) {
    const v = source.endereco;
    if (v.cep) cep = v.cep;
    if (v.rua) rua = v.rua;
    if (v.numero) numero = v.numero;
    if (v.bairro) bairro = v.bairro;
    if (v.cidade) cidade = v.cidade;
    if (v.estado) estado = v.estado;
    return { cep, rua, numero, bairro, cidade, estado };
  }

  // If there is a raw string in vitrineLocalizacao, vitrineEndereco or endereco
  const rawStr = (typeof source.vitrineLocalizacao === 'string' && source.vitrineLocalizacao.trim()) ||
    (typeof source.vitrineEndereco === 'string' && source.vitrineEndereco.trim()) ||
    (typeof source.endereco === 'string' && source.endereco.trim()) ||
    (typeof source === 'string' && source.trim()) || '';

  if (rawStr) {
    const segments = rawStr.split(' - ').map((s: string) => s.trim());
    if (segments.length >= 1) {
      const streetPart = segments[0];
      if (streetPart.includes(',')) {
        const [r, n] = streetPart.split(',').map((x: string) => x.trim());
        rua = r || rua;
        numero = n || numero;
      } else {
        rua = streetPart;
      }
    }
    if (segments.length >= 2) {
      bairro = segments[1] || bairro;
    }
    if (segments.length >= 3) {
      const cityState = segments[2];
      if (cityState.includes('/')) {
        const [c, e] = cityState.split('/').map((x: string) => x.trim());
        cidade = c || cidade;
        estado = e || estado;
      } else if (cityState.includes('-')) {
        const [c, e] = cityState.split('-').map((x: string) => x.trim());
        cidade = c || cidade;
        estado = e || estado;
      } else {
        cidade = cityState || cidade;
      }
    }
  }

  return { cep, rua, numero, bairro, cidade, estado };
}
