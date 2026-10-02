import type { VoiceId } from '@domain/voices/voices';

import type { VoiceText } from '@ui/foundation/voices/voices.types';

/** Each voice in European Portuguese. Quotes stay as published (see quotes.ts). */
export const voices: Record<VoiceId, VoiceText> = {
  plain: {
    name: 'Simples',
    tagline: 'Simples e direto',
    moodLabels: { 1: 'Muito em baixo', 2: 'Em baixo', 3: 'Assim-assim', 4: 'Bem', 5: 'Muito bem' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'Acrescenta uma nota (opcional)',
      afternoon: 'Acrescenta uma nota (opcional)',
      evening: 'Acrescenta uma nota (opcional)',
    },
    comfort: 'Parece um momento pesado. Fazes três respirações lentas comigo?',
    breathDone: 'Pronto. Sê gentil contigo 🌿',
    levels: [
      'Principiante',
      'Assíduo',
      'Constante',
      'Comprometido',
      'Dedicado',
      'Experiente',
      'Devoto',
      'Mestre',
    ],
    claude: {
      intro: '',
      ask: 'Reflete sobre esta semana. Que padrões notas (hora do dia, dias da semana, {signals}o que está nas notas)? Depois sugere uma coisa pequena e concreta que eu possa experimentar na próxima semana. Sê breve e gentil.',
    },
  },

  laoTzu: {
    name: 'Lao Tsé',
    tagline: 'Flui como a água',
    moodLabels: { 1: 'Água turva', 2: 'Agitada', 3: 'A fluir', 4: 'Ribeiro claro', 5: 'Lago parado' },
    slotLabels: { morning: 'Aurora', afternoon: 'Meio-dia', evening: 'Crepúsculo' },
    notePrompts: {
      morning: 'O que podes deixar por fazer hoje?',
      afternoon: 'Onde estás a forçar as coisas?',
      evening: 'O que largaste hoje?',
    },
    comfort: 'A água turva clareia quando a deixam parada. Descansa aqui três respirações lentas?',
    breathDone: 'A água assenta sozinha 🌊',
    levels: [
      'Gota de chuva',
      'Fio de água',
      'Regato',
      'Ribeiro',
      'Rio',
      'Espírito do vale',
      'Bloco por talhar',
      'Lago parado',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito do Tao Te Ching: com suavidade, sem julgar, preferindo ceder a forçar.',
      ask: 'Que padrões notas (onde nadei contra a corrente, onde as coisas fluíram, {signals}o que está nas notas)? Sugere uma coisa pequena que eu possa largar ou fazer menos na próxima semana. Sê breve e simples, como a água.',
    },
  },

  marcus: {
    name: 'Marco Aurélio',
    tagline: 'Cuida do que depende de ti',
    moodLabels: { 1: 'Perturbado', 2: 'Inquieto', 3: 'Firme', 4: 'Sereno', 5: 'Tranquilo' },
    slotLabels: { morning: 'Manhã', afternoon: 'Meio-dia', evening: 'Noite' },
    notePrompts: {
      morning: 'O que podes encontrar hoje, e como o vais enfrentar?',
      afternoon: 'O que, aqui, depende de ti?',
      evening: 'O que fizeste bem hoje? Onde ficaste aquém?',
    },
    comfort:
      'Até um imperador teve dias difíceis, e escreveu para si próprio através deles. Paras três respirações lentas?',
    breathDone: 'Recomeça, as vezes que precisares 🌅',
    levels: [
      'Pupilo',
      'Aprendiz',
      'Estudante da natureza',
      'Mente firme',
      'Guardião de si',
      'Cidadela',
      'Filósofo',
      'Imperador de si',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana como um mestre estoico, no espírito das Meditações de Marco Aurélio: calmo, honesto e gentil.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Ajuda-me a separar o que aconteceu dos meus juízos sobre isso, e o que dependia de mim do que não dependia. Sugere uma virtude ou pequena prática para a próxima semana. Sê breve e gentil com os dias difíceis.',
    },
  },

  seneca: {
    name: 'Séneca',
    tagline: 'Cartas a um amigo',
    moodLabels: { 1: 'Às voltas', 2: 'Inquieto', 3: 'Equilibrado', 4: 'À vontade', 5: 'Sereno' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'Como vais passar as horas de hoje?',
      afternoon: 'O que estás a temer que ainda não aconteceu?',
      evening: 'O que te ensinou o dia de hoje?',
    },
    comfort:
      'Uma hora difícil pesa menos partilhada. Escreve-te como a um amigo, depois de três respirações lentas?',
    breathDone: 'Sê o amigo a quem escreverias ✉️',
    levels: [
      'Correspondente',
      'Amigo',
      'Aprendiz',
      'Amigo constante',
      'Porto calmo',
      'Amigo sábio',
      'Sábio em formação',
      'Amigo para a vida',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana como Séneca faria numa das cartas a Lucílio: caloroso, prático e franco, como um velho amigo.',
      ask: 'Que padrões notas na forma como usei o meu tempo e atenção ({signals}as notas, a hora do dia)? Aponta algum medo que eu esteja a pedir emprestado ao futuro. Sugere uma coisa pequena e prática para a próxima semana. Escreve-o como uma carta curta.',
    },
  },

  rumi: {
    name: 'Rumi',
    tagline: 'Cada sentimento é um hóspede',
    moodLabels: { 1: 'Noite de saudade', 2: 'Dorido', 3: 'À procura', 4: 'Aconchegado', 5: 'Em êxtase' },
    slotLabels: { morning: 'Aurora', afternoon: 'Dia', evening: 'Noite' },
    notePrompts: {
      morning: 'O que chegou a ti esta manhã?',
      afternoon: 'Por que anseia o teu coração?',
      evening: 'O que vieram mostrar-te os sentimentos de hoje?',
    },
    comfort: 'Até este sentimento é um visitante. Ficas com ele três respirações lentas?',
    breathDone: 'Deixa o visitante descansar um pouco 🕯️',
    levels: ['Hóspede', 'Viajante', 'Buscador', 'Amante', 'Dervixe', 'Chama', 'Flauta de cana', 'Oceano'],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Rumi: terno, de coração aberto, acolhendo cada sentimento como um hóspede.',
      ask: 'Que padrões notas no que os meus dias trouxeram ({signals}as notas, a hora do dia)? Termina com uma pequena reflexão em forma de poema, original (não uma citação), e um pequeno convite para a próxima semana. Sê breve.',
    },
  },

  kabir: {
    name: 'Kabir',
    tagline: 'Palavras simples, coração aberto',
    moodLabels: { 1: 'Perdido no nevoeiro', 2: 'Pesado', 3: 'A escutar', 4: 'A cantar', 5: 'Em flor' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'O que vais escutar hoje?',
      afternoon: 'O que procuras longe que já está perto?',
      evening: 'O que foi simples e verdadeiro hoje?',
    },
    comfort: 'O que procuras está mais perto do que a tua respiração. Três respirações lentas?',
    breathDone: 'Simples, e perto 🪔',
    levels: [
      'Ouvinte',
      'Tecelão',
      'Cantor',
      'Coração simples',
      'Porta aberta',
      'Palavra certa',
      'Pássaro em voo',
      'Em plena flor',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Kabir: direto, caloroso e um pouco brincalhão, sem rodeios.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Di-lo de forma simples, como faria um poeta tecelão. Sugere uma coisa pequena e prática para a próxima semana. Termina com um verso original de duas linhas (não uma citação).',
    },
  },

  patanjali: {
    name: 'Patanjali',
    tagline: 'Acalma as ondas da mente',
    moodLabels: { 1: 'Turbulento', 2: 'Inquieto', 3: 'A assentar', 4: 'Claro', 5: 'Quieto' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'Qual é a tua intenção de prática para hoje?',
      afternoon: 'A que se está a agarrar a mente neste momento?',
      evening: 'Onde viveste o dia com firmeza e leveza?',
    },
    comfort: 'As ondas da mente sobem e descem. Observas três respirações lentas?',
    breathDone: 'Firme e à vontade 🧘',
    levels: [
      'Sentado',
      'A respirar',
      'Em prática',
      'Firme',
      'Concentrado',
      'Absorto',
      'Águas quietas',
      'Vidente claro',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito dos Yoga Sutras de Patanjali: paciente e sem julgar, tratando cada humor como um movimento da mente a observar.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Aponta com suavidade onde a prática constante (abhyasa) ajudou e onde o desapego (vairagya) poderia ajudar. Sugere uma pequena prática para a próxima semana. Sê breve.',
    },
  },

  lorde: {
    name: 'Audre Lorde',
    tagline: 'Sentir é uma forma de saber',
    moodLabels: { 1: 'Esgotada', 2: 'Na defensiva', 3: 'Presente', 4: 'Com chão', 5: 'Viva' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'De que precisas para cuidar de ti hoje?',
      afternoon: 'O que te está a dizer o corpo agora?',
      evening: 'O que disseste hoje, e o que ficou por dizer?',
    },
    comfort: 'Cuidar de ti não é um luxo. Três respirações lentas, só para ti?',
    breathDone: 'Mereces este cuidado 🕯️',
    levels: [
      'A sentir',
      'A reparar',
      'A nomear',
      'A falar',
      'Com chão',
      'Com poder',
      'Guerreira poeta',
      'Plenamente viva',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Audre Lorde: direta, calorosa e sem desviar o olhar, tratando os meus sentimentos como fonte de conhecimento e o cuidado comigo como necessário, não como indulgência.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Diz o que os meus sentimentos podem estar a dizer-me, com clareza e sem os esvaziar. Sugere um pequeno gesto de cuidado comigo para a próxima semana. Sê breve.',
    },
  },

  capra: {
    name: 'Fritjof Capra',
    tagline: 'Tudo está ligado',
    moodLabels: { 1: 'Desligado', 2: 'Enredado', 3: 'Equilibrado', 4: 'A fluir', 5: 'Em ressonância' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'A que estás ligado hoje?',
      afternoon: 'De que padrões fazes parte neste momento?',
      evening: 'Como se espalhou o teu dia até aos outros?',
    },
    comfort: 'Fazes parte de uma teia maior, mesmo agora. Três respirações lentas?',
    breathDone: 'Ligado, respiração a respiração 🌿',
    levels: ['Nó', 'Fio', 'Padrão', 'Rede', 'Teia', 'Ecossistema', 'Sistema vivo', 'Todo'],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Fritjof Capra: como alguém que pensa em sistemas, vendo os meus humores como parte de uma teia de relações, ritmos e ciclos de feedback.',
      ask: 'Que padrões e ciclos de feedback notas ({signals}as notas, a hora do dia, como uma parte do dia molda a seguinte)? Sugere uma pequena mudança que se possa propagar por todo o sistema na próxima semana. Sê breve.',
    },
  },

  jesus: {
    name: 'Jesus',
    tagline: 'Basta o dia de hoje',
    moodLabels: { 1: 'Cansado', 2: 'Perturbado', 3: 'Em descanso', 4: 'Com esperança', 5: 'Alegre' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'O que basta para hoje?',
      afternoon: 'Quem precisaria agora da tua bondade?',
      evening: 'Pelo que estás grato esta noite?',
    },
    comfort: 'Vem descansar um pouco. Três respirações lentas?',
    breathDone: 'A paz esteja contigo 🕊️',
    levels: [
      'Semente',
      'Rebento',
      'Candeia acesa',
      'Sal da terra',
      'Pastor',
      'Boa terra',
      'Luz no monte',
      'Colheita plena',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito dos ensinamentos de Jesus nos Evangelhos: gentil, compassivo e esperançoso, sem sermões.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Onde poderia eu largar a preocupação com o amanhã, e onde a bondade, para com os outros ou comigo, poderia ajudar? Sugere uma coisa pequena para a próxima semana. Sê breve.',
    },
  },

  muhammad: {
    name: 'Maomé',
    tagline: 'Paciência, gratidão e misericórdia',
    moodLabels: { 1: 'Sobrecarregado', 2: 'Inquieto', 3: 'Paciente', 4: 'Grato', 5: 'Em paz' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'Que intenção pões no dia de hoje?',
      afternoon: 'Onde precisas de paciência agora?',
      evening: 'Pelo que estás grato hoje?',
    },
    comfort: 'Com a dificuldade vem a facilidade. Três respirações lentas?',
    breathDone: 'Que a paz esteja contigo 🌙',
    levels: [
      'Viajante',
      'Paciente',
      'Grato',
      'Perseverante',
      'Coração gentil',
      'Mão generosa',
      'Coração em paz',
      'Lanterna',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito dos ensinamentos do Profeta Maomé sobre a paciência (sabr), a gratidão (shukr) e a misericórdia, com respeito e sem pretender falar por ele.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Onde é que a paciência ou a gratidão me ampararam, e onde poderiam ajudar? Sugere uma prática pequena e gentil para a próxima semana. Sê breve.',
    },
  },

  buddha: {
    name: 'Buda',
    tagline: 'A mente em paz',
    moodLabels: { 1: 'Nublado', 2: 'Agitado', 3: 'Atento', 4: 'Contente', 5: 'Sereno' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'A que vais prestar atenção hoje?',
      afternoon: 'A que te estás a agarrar neste momento?',
      evening: 'Onde te trataste com bondade hoje?',
    },
    comfort: 'Também isto passa. Três respirações atentas?',
    breathDone: 'Só esta respiração 🪷',
    levels: [
      'Rebento',
      'Botão de lótus',
      'Passo atento',
      'Caminho do meio',
      'Mão aberta',
      'Mente quieta',
      'Sombra da bodhi',
      'Coração desperto',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito dos ensinamentos do Buda no Dhammapada: calmo, claro e bondoso, reparando em como os pensamentos moldam os humores.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? Aponta com suavidade onde surgiram o desejo, a aversão ou uma mente agitada, e onde houve leveza. Sugere uma pequena prática de atenção plena para a próxima semana. Sê breve.',
    },
  },

  shiva: {
    name: 'Shiva',
    tagline: 'A quietude que transforma',
    moodLabels: { 1: 'Disperso', 2: 'Turbulento', 3: 'Centrado', 4: 'Quieto', 5: 'Radiante' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'O que estás pronto para largar hoje?',
      afternoon: 'Onde podes estar quieto dentro do movimento?',
      evening: 'O que terminou hoje, e o que começou?',
    },
    comfort: 'Até as tempestades passam por cima da montanha. Três respirações lentas?',
    breathDone: 'Quieto como a montanha 🏔️',
    levels: ['Faísca', 'Sopro', 'Tambor', 'Ritmo', 'Bailarino', 'Terceiro olho', 'Quietude', 'Dança cósmica'],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Shiva, o iogue da quietude e a dança da mudança: calmo e profundo, honrando tanto os fins como os começos.',
      ask: 'Que padrões notas ({signals}as notas, a hora do dia)? O que poderá estar pronto para terminar, e o que está a tentar começar? Sugere uma pequena prática de quietude para a próxima semana. Sê breve.',
    },
  },

  caeiro: {
    name: 'Alberto Caeiro',
    tagline: 'Ver, apenas ver',
    moodLabels: { 1: 'Nevoeiro', 2: 'Chuva', 3: 'Campo aberto', 4: 'Ao sol', 5: 'Sol aberto' },
    slotLabels: { morning: 'Manhã', afternoon: 'Meio-dia', evening: 'Entardecer' },
    notePrompts: {
      morning: 'O que viste esta manhã, só por ver?',
      afternoon: 'O que está simplesmente aqui, agora?',
      evening: 'O que te mostrou o dia, sem o explicares?',
    },
    comfort: 'A chuva é só chuva. Deixa-a cair durante três respirações lentas?',
    breathDone: 'O sol volta sozinho ☀️',
    levels: [
      'Semente',
      'Erva',
      'Cordeirinho',
      'Rebanho',
      'Vento que passa',
      'Cajado',
      'Cimo do outeiro',
      'Pastor',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Alberto Caeiro: com simplicidade, pelos sentidos, sem metafísica nem julgamento.',
      ask: 'O que notas, da forma mais simples possível (o que eu vi de facto, onde pensei em vez de olhar, {signals}o que está nas notas)? Sugere uma coisa pequena para olhar, ou para deixar de pensar, na próxima semana. Sê breve e simples, como um campo.',
    },
  },

  nhatHanh: {
    name: 'Thich Nhat Hanh',
    tagline: 'Respira e sorri',
    moodLabels: { 1: 'Lama', 2: 'Nublado', 3: 'A respirar', 4: 'A sorrir', 5: 'Lótus' },
    slotLabels: { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' },
    notePrompts: {
      morning: 'O que podes fazer hoje com toda a atenção?',
      afternoon: 'Onde podes voltar à tua respiração?',
      evening: 'Houve algo hoje a que sorrir?',
    },
    comfort: 'Este sentimento é uma nuvem a passar. Inspira, expira, três vezes comigo?',
    breathDone: 'Estás aqui, e isso basta 🪷',
    levels: [
      'Seixo',
      'Semente',
      'Lodo',
      'Um respiro',
      'Passo atento',
      'Meio sorriso',
      'Sino da atenção',
      'Lótus',
    ],
    claude: {
      intro:
        'Reflete sobre a minha semana no espírito de Thich Nhat Hanh: com atenção plena, compaixão e um sorriso suave.',
      ask: 'O que notas (onde estive presente, onde me deixei levar, {signals}o que está nas notas)? Sugere uma pequena prática de atenção plena para a próxima semana, como uma respiração ou uma caminhada. Sê breve e gentil.',
    },
  },
};
