/**
 * Conteúdo institucional do estúdio (textos do próprio Mike, adaptados).
 * Fonte: taggo.one/artextreme e @tattooartextremee.
 */

export const ARTIST = {
  name: 'Mike',
  handle: 'Tattooartextreme',
  /** Retrato principal (formato 4:5). */
  photo: '/images/mike-portrait.webp',
  /** Foto de perfil redonda (a mesma do Instagram/Taggo). */
  avatar: '/images/mike.webp',
  since: 2015,
  founded: 2017,
  origin: 'Carioca',
  specialties: ['Blackwork', 'Rastelado'],
}

export interface Work {
  src: string
  title: string
  /** Estilo citado na legenda do próprio post (só quando confirmado). */
  tag?: string
  url: string
}

/** Trabalhos recentes, do Instagram do Mike. Para trocar: coloque a imagem em public/images/works. */
export const WORKS: Work[] = [
  { src: '/images/works/tattoo-05.webp', title: 'Faith 1989', tag: 'Trash Polka', url: 'https://www.instagram.com/p/DdY7J_RO7GF/' },
  { src: '/images/works/tattoo-04.webp', title: 'Samurai', tag: 'Conceitual', url: 'https://www.instagram.com/p/DeCi1XuxfVb/' },
  { src: '/images/works/tattoo-03.webp', title: 'Pela honra e glória', tag: 'Blackwork', url: 'https://www.instagram.com/reel/DepiVncChtK/' },
  { src: '/images/works/tattoo-08.webp', title: 'Fechamento geométrico', url: 'https://www.instagram.com/p/DdRhrvKjsZ7/' },
  { src: '/images/works/tattoo-02.webp', title: 'Árvore da vida', tag: 'Projeto autoral', url: 'https://www.instagram.com/reel/DeuiA6QiogL/' },
  { src: '/images/works/tattoo-07.webp', title: 'Mandala geométrica', url: 'https://www.instagram.com/p/DdT3QTJuMTN/' },
  { src: '/images/works/tattoo-06.webp', title: 'Mandala e flores', url: 'https://www.instagram.com/p/DdWQ6-Iunb7/' },
  { src: '/images/works/tattoo-01.webp', title: 'Meditação', tag: 'Minimalista', url: 'https://www.instagram.com/p/Dey72WVxMys/' },
]

/** Premiações: 4× 1º lugar, 1× 2º lugar, 1× 3º lugar. */
export const AWARDS: { place: 1 | 2 | 3 }[] = [
  { place: 1 },
  { place: 1 },
  { place: 1 },
  { place: 1 },
  { place: 2 },
  { place: 3 },
]

export const TIMELINE = [
  { year: '2015', text: 'Começa a tatuar ao lado do irmão, Marlon, sua grande inspiração.' },
  { year: '2016', text: 'Abre o primeiro estúdio numa pequena garagem, onde fica por cerca de um ano.' },
  { year: '2017', text: 'Nova unidade no Rio de Janeiro e nasce a ArtExtreme.' },
]

export const BIO = [
  'Carioca, tatuador desde 2015 e fascinado por tecnologia. Desde 2017 a ArtExtreme atende quem procura um profissional que entende a ideia e transforma em arte: cada projeto nasce de um briefing e de um concept desenhado no Photoshop, Concepts e ArtFlow antes de chegar na pele.',
  'A proposta é que você saia não só com uma tatuagem, mas com um dia marcante. Além de arte na pele, tatuar é uma forma milenar de comunicação e expressão.',
]

export const CARE_GUIDE = [
  {
    title: 'Primeiro dia',
    items: ['Banho com plástico protegendo a tattoo', 'Assepsia com sabão e papel toalha úmido'],
  },
  {
    title: 'Próximos 4 dias',
    items: ['Plástico no banho', 'Assepsia com sabão e papel toalha', 'Pomada após a assepsia'],
  },
  {
    title: 'Após o 4º dia',
    items: ['Banho normal', 'Pomada após o banho', 'Quando a casca sair toda: alimentação normal e pomada até o fim do tubo'],
  },
]

export const CARE_AVOID = {
  food: ['Chocolate', 'Amendoim', 'Pimenta', 'Comida japonesa', 'Carne de porco'],
  actions: [
    'Coçar ou arrancar a casquinha',
    'Esfregar com toalha',
    'Usar produtos não recomendados pelo artista',
    'Roupas apertadas sobre a tattoo',
  ],
}

export const ASEPSIS = 'Faça espuma com sabonete antibacteriano (ou Johnson’s Baby), aplique num papel toalha úmido e limpe sempre de cima para baixo.'
