import type { Quote, VoiceId } from './voices';

const LEGGE = 'tr. James Legge, 1891';
const LONG = 'tr. George Long, 1862';
const GUMMERE = (year: number) => `tr. Richard M. Gummere, ${year}`;
const NICHOLSON = 'tr. R. A. Nicholson, 1898';
const TAGORE = 'tr. Rabindranath Tagore, 1915';
const JOHNSTON = 'tr. Charles Johnston, 1912';

/**
 * Default quotes for each voice, verbatim from public-domain translations and
 * checked word for word against the source texts. Bracketed words are the
 * translator's own. Users can replace them per voice in Settings.
 */
export const DEFAULT_QUOTES: Record<VoiceId, Quote[]> = {
  plain: [],

  laoTzu: [
    {
      text: 'The highest excellence is like (that of) water. The excellence of water appears in its benefiting all things…',
      source: `Tao Te Ching, ch. 8 (${LEGGE})`,
    },
    {
      text: 'It is better to leave a vessel unfilled, than to attempt to carry it when it is full.',
      source: `Tao Te Ching, ch. 9 (${LEGGE})`,
    },
    {
      text: 'Who can (make) the muddy water (clear)? Let it be still, and it will gradually become clear.',
      source: `Tao Te Ching, ch. 15 (${LEGGE})`,
    },
    {
      text: 'The partial becomes complete; the crooked, straight; the empty, full; the worn out, new.',
      source: `Tao Te Ching, ch. 22 (${LEGGE})`,
    },
    {
      text: 'A violent wind does not last for a whole morning; a sudden rain does not last for the whole day.',
      source: `Tao Te Ching, ch. 23 (${LEGGE})`,
    },
    {
      text: 'He who knows other men is discerning; he who knows himself is intelligent.',
      source: `Tao Te Ching, ch. 33 (${LEGGE})`,
    },
    {
      text: '…the sufficiency of contentment is an enduring and unchanging sufficiency.',
      source: `Tao Te Ching, ch. 46 (${LEGGE})`,
    },
    {
      text: 'The tree which fills the arms grew from the tiniest sprout; the tower of nine storeys rose from a (small) heap of earth; the journey of a thousand li commenced with a single step.',
      source: `Tao Te Ching, ch. 64 (${LEGGE})`,
    },
  ],

  marcus: [
    {
      text: 'In the morning when thou risest unwillingly, let this thought be present—I am rising to the work of a human being.',
      source: `Meditations, Book V, 1 (${LONG})`,
    },
    {
      text: 'For nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul…',
      source: `Meditations, Book IV, 3 (${LONG})`,
    },
    {
      text: 'Everything is only for a day, both that which remembers and that which is remembered.',
      source: `Meditations, Book IV, 35 (${LONG})`,
    },
    {
      text: 'Be like the promontory against which the waves continually break, but it stands firm and tames the fury of the water around it.',
      source: `Meditations, Book IV, 49 (${LONG})`,
    },
    {
      text: 'Look within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.',
      source: `Meditations, Book VII, 59 (${LONG})`,
    },
    {
      text: 'Do not disturb thyself by thinking of the whole of thy life. Let not thy thoughts at once embrace all the various troubles which thou mayest expect to befall thee…',
      source: `Meditations, Book VIII, 36 (${LONG})`,
    },
    { text: 'Loss is nothing else than change.', source: `Meditations, Book IX, 35 (${LONG})` },
    {
      text: 'Take away then, when thou choosest, thy opinion, and like a mariner who has doubled the promontory, thou wilt find calm, everything stable, and a waveless bay.',
      source: `Meditations, Book XII, 22 (${LONG})`,
    },
  ],

  seneca: [
    {
      text: 'Lay hold of to-day’s task, and you will not need to depend so much upon to-morrow’s.',
      source: `Letters to Lucilius, 1 (${GUMMERE(1917)})`,
    },
    {
      text: 'It is not the man who has too little, but the man who craves more, that is poor.',
      source: `Letters to Lucilius, 2 (${GUMMERE(1917)})`,
    },
    {
      text: 'What progress, you ask, have I made? I have begun to be a friend to myself.',
      source: `Letters to Lucilius, 6, quoting Hecato (${GUMMERE(1917)})`,
    },
    {
      text: 'There are more things, Lucilius, likely to frighten us than there are to crush us; we suffer more often in imagination than in reality.',
      source: `Letters to Lucilius, 13 (${GUMMERE(1917)})`,
    },
    {
      text: 'Above all, my dear Lucilius, make this your business: learn how to feel joy.',
      source: `Letters to Lucilius, 23 (${GUMMERE(1917)})`,
    },
    {
      text: 'O when shall you see the time when you shall know that time means nothing to you, when you shall be peaceful and calm, careless of the morrow…',
      source: `Letters to Lucilius, 32 (${GUMMERE(1917)})`,
    },
    {
      text: 'And that which was bitter to bear is pleasant to have borne; it is natural to rejoice at the ending of one’s ills.',
      source: `Letters to Lucilius, 78 (${GUMMERE(1920)})`,
    },
    {
      text: 'But that joy which springs wholly from oneself is leal and sound; it increases and attends us to the last…',
      source: `Letters to Lucilius, 98 (${GUMMERE(1925)})`,
    },
  ],

  rumi: [
    {
      text: 'Grape-juice does not turn to wine, unless it ferment awhile in the jar; / Would you have your heart grow bright, you must take a little trouble.',
      source: `Divani Shamsi Tabriz, IV (${NICHOLSON})`,
    },
    {
      text: 'Every fair shape you have seen, every deep saying you have heard, / Be not cast down that it perished; for that is not so.',
      source: `Divani Shamsi Tabriz, XII (${NICHOLSON})`,
    },
    {
      text: 'Put grief out of your head and keep quaffing this river-water; / Do not think of the water failing; for this water is without end.',
      source: `Divani Shamsi Tabriz, XII (${NICHOLSON})`,
    },
    {
      text: 'Dismiss cares and be utterly clear of heart, / Like the face of a mirror without image and picture.',
      source: `Divani Shamsi Tabriz, XIII (${NICHOLSON})`,
    },
    {
      text: 'When the drop departed from its native home and returned, / It found a shell and became a pearl.',
      source: `Divani Shamsi Tabriz, XXVII (${NICHOLSON})`,
    },
    {
      text: 'From sourness and bitterness advance to sweetness, / Even as from briny soil a thousand sorts of fruit spring up.',
      source: `Divani Shamsi Tabriz, XXVII (${NICHOLSON})`,
    },
    {
      text: 'Thou mak’st grow out of me now a thorn and now a rose / Now I smell roses and now pull thorns.',
      source: `Divani Shamsi Tabriz, XXX (${NICHOLSON})`,
    },
  ],

  kabir: [
    {
      text: 'O servant, where dost thou seek Me? / Lo! I am beside thee.',
      source: `Songs of Kabir, I (${TAGORE})`,
    },
    {
      text: 'When the wave rises, it is the water; and when it falls, it is the same water again.',
      source: `Songs of Kabir, XIV (${TAGORE})`,
    },
    {
      text: 'Dance, my heart! dance to-day with joy. / The strains of love fill the days and the nights with music, and the world is listening to its melodies…',
      source: `Songs of Kabir, XXXII (${TAGORE})`,
    },
    {
      text: 'The rising and the setting are one to me; all contradictions are solved.',
      source: `Songs of Kabir, XLI (${TAGORE})`,
    },
    {
      text: 'I have stilled my restless mind, and my heart is radiant…',
      source: `Songs of Kabir, XLVIII (${TAGORE})`,
    },
    {
      text: "Why so impatient, my heart? / He who watches over birds, beasts, and insects, / He who cared for you whilst you were yet in your mother's womb, / Shall He not care for you now that you are come forth?",
      source: `Songs of Kabir, LXIII (${TAGORE})`,
    },
    {
      text: 'The Lord is in me, the Lord is in you, as life is in every seed.',
      source: `Songs of Kabir, XCVII (${TAGORE})`,
    },
  ],

  patanjali: [
    {
      text: 'This becomes a firm resting-place, when followed long, persistently, with earnestness.',
      source: `Yoga Sutras, I.14 (${JOHNSTON})`,
    },
    {
      text: 'By sympathy with the happy, compassion for the sorrowful, delight in the holy, disregard of the unholy, the psychic nature moves to gracious peace.',
      source: `Yoga Sutras, I.33 (${JOHNSTON})`,
    },
    {
      text: 'Or peace may be reached by the even sending forth and control of the life-breath.',
      source: `Yoga Sutras, I.34 (${JOHNSTON})`,
    },
    {
      text: 'When pure perception without judicial action of the mind is reached, there follows the gracious peace of the inner self.',
      source: `Yoga Sutras, I.47 (${JOHNSTON})`,
    },
    {
      text: 'From acceptance, the disciple gains happiness supreme.',
      source: `Yoga Sutras, II.42 (${JOHNSTON})`,
    },
    {
      text: 'One of the wise has said: accept conditions, accept others, accept yourself.',
      source: `Yoga Sutras, II.42, Johnston’s commentary (${JOHNSTON})`,
    },
    { text: 'Right poise must be firm and without strain.', source: `Yoga Sutras, II.46 (${JOHNSTON})` },
    {
      text: 'Right poise is to be gained by steady and temperate effort, and by setting the heart upon the everlasting.',
      source: `Yoga Sutras, II.47 (${JOHNSTON})`,
    },
  ],

  // Short quotations from copyrighted books, for personal use: each is listed as sourced on Wikiquote
  // and was matched against a scan of the original book.
  lorde: [
    {
      text: 'Caring for myself is not self-indulgence, it is self-preservation, and that is an act of political warfare.',
      source: 'A Burst of Light: Essays (1988), "A Burst of Light: Living with Cancer", p. 125',
    },
    {
      text: 'We can train ourselves to respect our feelings and to transpose them into a language so they can be shared.',
      source: '"Poetry Is Not a Luxury", in Sister Outsider (1984), p. 37',
    },
    {
      text: 'Poetry is the way we help give name to the nameless so it can be thought.',
      source: '"Poetry Is Not a Luxury", in Sister Outsider (1984), p. 37',
    },
    {
      text: 'We can learn to work and speak when we are afraid in the same way we have learned to work and speak when we are tired.',
      source: '"The Transformation of Silence into Language and Action", in Sister Outsider (1984), p. 44',
    },
    {
      text: 'The sharing of joy, whether physical, emotional, psychic, or intellectual, forms a bridge between the sharers which can be the basis for understanding much of what is not shared between them …',
      source: '"Uses of the Erotic: The Erotic as Power", in Sister Outsider (1984), p. 56',
    },
    {
      text: 'Difference is that raw and powerful connection from which our personal power is forged.',
      source:
        '"The Master\'s Tools Will Never Dismantle the Master\'s House", in Sister Outsider (1984), p. 112',
    },
    {
      text: 'Nothing I accept about myself can be used against me to diminish me.',
      source: '"Eye to Eye: Black Women, Hatred, and Anger", in Sister Outsider (1984)',
    },
    {
      text: 'We are not perfect, but we are stronger and wiser than the sum of our errors.',
      source: '"Learning from the 60s", in Sister Outsider (1984), p. 138',
    },
  ],
  capra: [
    {
      text: 'One of the key insights of the systems approach has been the realization that the network is a pattern that is common to all life. Wherever we see life, we see networks.',
      source: 'The Hidden Connections (2002), p. 8',
    },
    {
      text: 'A diverse community is a resilient community, capable of adapting to changing situations.',
      source: 'The Web of Life (1996), Epilogue: Ecological Literacy, p. 303',
    },
    {
      text: 'Partnership—the tendency to associate, establish links, live inside one another, and cooperate—is one of the hallmarks of life.',
      source: 'The Web of Life (1996), Epilogue: Ecological Literacy, p. 300',
    },
    {
      text: 'Understanding ecological interdependence means understanding relationships. It requires the shifts of perception … from the parts to the whole, from objects to relationships, from contents to patterns.',
      source: 'The Web of Life (1996), Epilogue: Ecological Literacy, p. 298',
    },
    {
      text: 'In quantum theory we never end up with any “things”; we always deal with interconnections.',
      source: 'The Web of Life (1996), p. 30',
    },
    {
      text: 'The dance of Shiva is the dancing universe, the ceaseless flow of energy going through an infinite variety of patterns that melt into one another.',
      source: 'The Tao of Physics (1975), Ch. 15 "The Cosmic Dance", p. 244',
    },
    {
      text: 'Lack of flexibility manifests itself as stress.',
      source: 'The Web of Life (1996), Epilogue: Ecological Literacy, p. 302',
    },
    {
      text: '… the community will need stability and change, order and freedom, tradition and innovation.',
      source: 'The Web of Life (1996), Epilogue: Ecological Literacy, p. 303',
    },
  ],

  // Words of Jesus in the Gospels (King James Version).
  jesus: [
    {
      text: 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.',
      source: 'Matthew 6:34 (King James Version, 1611)',
    },
    {
      text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
      source: 'Matthew 11:28 (King James Version, 1611)',
    },
    {
      text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
      source: 'John 14:27 (King James Version, 1611)',
    },
    {
      text: 'Come ye yourselves apart into a desert place, and rest a while…',
      source: 'Mark 6:31 (King James Version, 1611)',
    },
    {
      text: 'Consider the lilies how they grow: they toil not, they spin not; and yet I say unto you, that Solomon in all his glory was not arrayed like one of these.',
      source: 'Luke 12:27 (King James Version, 1611)',
    },
    {
      text: 'Blessed are they that mourn: for they shall be comforted.',
      source: 'Matthew 5:4 (King James Version, 1611)',
    },
    {
      text: 'And as ye would that men should do to you, do ye also to them likewise.',
      source: 'Luke 6:31 (King James Version, 1611)',
    },
    {
      text: 'These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.',
      source: 'John 16:33 (King James Version, 1611)',
    },
  ],
  // Qur'an verses (Pickthall). In Islam these are God's words, not Muhammad's, so they're cited as the Qur'an.
  muhammad: [
    {
      text: 'But lo! with hardship goeth ease, / Lo! with hardship goeth ease;',
      source: "Qur'an 94:5–6 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'Allah tasketh not a soul beyond its scope.',
      source: "Qur'an 2:286 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'Verily in the remembrance of Allah do hearts find rest!',
      source: "Qur'an 13:28 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'Thy Lord hath not forsaken thee nor doth He hate thee, / And verily the latter portion will be better for thee than the former, / And verily thy Lord will give unto thee so that thou wilt be content.',
      source: "Qur'an 93:3–5 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'O ye who believe! Seek help in stedfastness and prayer. Lo! Allah is with the stedfast.',
      source: "Qur'an 2:153 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'Despair not of the mercy of Allah, Who forgiveth all sins. Lo! He is the Forgiving, the Merciful.',
      source: "Qur'an 39:53 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'We verily created man and We know what his soul whispereth to him, and We are nearer to him than his jugular vein.',
      source: "Qur'an 50:16 (tr. Marmaduke Pickthall, 1930)",
    },
    {
      text: 'Allah will vouchsafe, after hardship, ease.',
      source: "Qur'an 65:7 (tr. Marmaduke Pickthall, 1930)",
    },
  ],
  // The Dhammapada (Müller).
  buddha: [
    {
      text: 'All that we are is the result of what we have thought: it is founded on our thoughts, it is made up of our thoughts.',
      source: 'Dhammapada, v. 1 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'For hatred does not cease by hatred at any time: hatred ceases by love, this is an old rule.',
      source: 'Dhammapada, v. 5 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'It is good to tame the mind, which is difficult to hold in and flighty, rushing wherever it listeth; a tamed mind brings happiness.',
      source: 'Dhammapada, v. 35 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'As a solid rock is not shaken by the wind, wise people falter not amidst blame and praise.',
      source: 'Dhammapada, v. 81 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'Wise people, after they have listened to the laws, become serene, like a deep, smooth, and still lake.',
      source: 'Dhammapada, v. 82 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'Let no man think lightly of good, saying in his heart, It will not come nigh unto me. Even by the falling of water-drops a water-pot is filled…',
      source: 'Dhammapada, v. 122 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'Health is the greatest of gifts, contentedness the best riches; trust is the best of relationships, Nirvana the highest happiness.',
      source: 'Dhammapada, v. 204 (tr. F. Max Müller, 1881)',
    },
    {
      text: 'Let a man overcome anger by love, let him overcome evil by good; let him overcome the greedy by liberality, the liar by truth!',
      source: 'Dhammapada, v. 223 (tr. F. Max Müller, 1881)',
    },
  ],
  // The Svetasvatara Upanishad, which praises Rudra/Śiva (Müller).
  shiva: [
    {
      text: 'O Rudra, thou dweller in the mountains, look upon us with that most blessed form of thine which is auspicious, not terrible, and reveals no evil!',
      source: 'Svetasvatara Upanishad III.5 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'As a metal disk (mirror), tarnished by dust, shines bright again after it has been cleaned, so is the one incarnate person satisfied and free from grief, after he has seen the real nature of the self.',
      source: 'Svetasvatara Upanishad II.14 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'When that god is known, all fetters fall off, sufferings are destroyed, and birth and death cease.',
      source: 'Svetasvatara Upanishad I.11 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'If a wise man hold his body with its three erect parts (chest, neck, and head) even, and turn his senses with the mind towards the heart, he will then in the boat of Brahman cross all the torrents which cause fear.',
      source: 'Svetasvatara Upanishad II.8 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'The Self, smaller than small, greater than great, is hidden in the heart of the creature. A man who has left all grief behind, sees the majesty, the Lord, the passionless, by the grace of the creator (the Lord).',
      source: 'Svetasvatara Upanishad III.20 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'He who has known him who is more subtile than subtile, in the midst of chaos, creating all things, having many forms, alone enveloping everything, the happy one (Siva), passes into peace for ever.',
      source: 'Svetasvatara Upanishad IV.14 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'When the light has risen, there is no day, no night, neither existence nor non-existence; Siva (the blessed) alone is there.',
      source: 'Svetasvatara Upanishad IV.18 (tr. F. Max Müller, 1884)',
    },
    {
      text: 'O Rudra, let thy gracious face protect me for ever!',
      source: 'Svetasvatara Upanishad IV.21 (tr. F. Max Müller, 1884)',
    },
  ],
};

/**
 * Why each voice's default quotes may be used: public-domain translations, or
 * short quotations from books still under copyright (fine in a personal app, but
 * kept brief and sourced).
 */
export type QuotesLicense = 'public-domain' | 'short-quotation' | 'none';

export const QUOTES_LICENSE: Record<VoiceId, QuotesLicense> = {
  plain: 'none',
  laoTzu: 'public-domain',
  marcus: 'public-domain',
  seneca: 'public-domain',
  rumi: 'public-domain',
  kabir: 'public-domain',
  patanjali: 'public-domain',
  lorde: 'short-quotation',
  capra: 'short-quotation',
  jesus: 'public-domain',
  muhammad: 'public-domain',
  buddha: 'public-domain',
  shiva: 'public-domain',
};
