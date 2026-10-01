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
};
