import type { VoiceId } from '@domain/voices/voices';
import type { VoiceText } from '@ui/voices/voices.types';

/**
 * The shape of the app's text: every locale (see ./locales) provides exactly these
 * entries, so a missing translation is a type error. Entries that depend on a number
 * or a name are functions.
 */
export type Messages = {
  common: {
    cancel: string;
    save: string;
    update: string;
    remove: string;
    add: string;
    close: string;
    stop: string;
    notNow: string;
    continue: string;
    allow: string;
    openSettings: string;
    openAppSettings: string;
    less: string;
    more: string;
    today: string;
    notLogged: string;
  };
  tabs: {
    checkin: string;
    stats: string;
    settings: string;
  };
  moods: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };
  slots: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  greetings: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  streak: (days: number) => string;
  name: {
    promptTitle: string;
    promptBody: string;
    placeholder: string;
    settingsTitle: string;
  };
  checkin: {
    dayA11y: (date: string, count: number) => string;
    addNote: string;
    couldNotSave: string;
    removeTitle: string;
    removeLink: string;
    breatheWithMe: string;
    usuallyAbout: (value: string) => string;
    savedWithNext: string;
    pause: string;
    pauseA11y: string;
    anotherQuote: string;
  };
  signals: {
    unlocks: (n: number) => string;
    steps: (n: number) => string;
    since: (what: string, time: string) => string;
  };
  stats: {
    overallAverage: string;
    logged: string;
    unlocksPerCheckIn: string;
    stepsPerCheckIn: string;
    last7Days: string;
    average: string;
    unlocksRow: string;
    stepsRow: string;
    includeHabits: string;
    includeHabitsA11y: string;
    reflect: string;
    reflectHint: string;
    shareFailed: string;
    habits: string;
    history: string;
    cellA11y: (date: string, slot: string, detail: string) => string;
    moodDetail: (mood: number) => string;
    unlocksDetail: (n: number) => string;
    stepsDetail: (n: number) => string;
  };
  calendar: {
    previousMonth: string;
    nextMonth: string;
    dayA11y: (date: string, count: number) => string;
    editDay: string;
    readOnly: (days: number) => string;
    hint: (months: number, days: number) => string;
  };
  habits: {
    sinceLastCheckIn: string;
    goodThings: string;
    insteadPlaceholder: string;
    roughly: string;
    roughlyA11y: (on: boolean) => string;
    fewer: (unit: string) => string;
    moreOf: (unit: string) => string;
    countA11y: (count: number, unit: string) => string;
    notLoggedA11y: (name: string) => string;
    notLoggedThisWeek: (emoji: string, name: string) => string;
    growWeek: (emoji: string, name: string, wins: number, logged: number) => string;
    reduceWeek: (emoji: string, wins: number, logged: number, total: number, unit: string) => string;
    moodWithNone: (none: string, some: string) => string;
    insteadTitle: string;
  };
  balance: {
    title: string;
    empty: string;
    thisWeek: string;
    light: (n: number) => string;
    heavy: (n: number) => string;
    tapDay: string;
    dayDetail: (day: string, light: number, heavy: number, net: string) => string;
    chartA11y: (days: string) => string;
    barA11y: (day: string, light: number, heavy: number) => string;
    verdicts: {
      flourishing: string;
      leaningLight: string;
      inBalance: string;
      heavier: string;
    };
    lighter: (diff: number) => string;
    heavierThanLast: (diff: number) => string;
    same: string;
  };
  savings: {
    title: string;
    thisWeek: (amount: string) => string;
    enoughFor: (label: string) => string;
    moreFor: (amount: string, label: string) => string;
    setUsual: string;
    jarA11y: (pct: number) => string;
    milestones: Record<number, string>;
  };
  practice: {
    title: string;
    countBreaths: string;
    focus: string;
    breathsOption: (n: number) => string;
    minutesOption: (n: number) => string;
    startFor: (time: string) => string;
    start: string;
    footnote: string;
    back: string;
    phases: {
      in: string;
      hold: string;
      out: string;
    };
    breathOf: (breath: number, total: number, left: string) => string;
    breathsDone: (n: number, pattern: string) => string;
    patterns: {
      calm: {
        name: string;
        description: string;
      };
      box: {
        name: string;
        description: string;
      };
      relax: {
        name: string;
        description: string;
      };
    };
    objects: {
      candle: {
        name: string;
        hint: string;
      };
      dot: {
        name: string;
        hint: string;
      };
      object: {
        name: string;
        hint: string;
      };
    };
    focusDone: string;
    timeLeftA11y: (left: string) => string;
    finished: string;
    bellTitle: string;
    bellChannel: string;
    guidedIn: string;
    guidedOut: string;
    guidedCount: (n: number, total: number) => string;
  };
  reminders: {
    title: string;
    channel: string;
    notificationTitle: (slot: string) => string;
    bodyNamed: (name: string) => string;
    body: string;
    earlier: (slot: string) => string;
    later: (slot: string) => string;
    atA11y: (slot: string, time: string) => string;
    offTitle: string;
    offBody: string;
    failed: string;
  };
  settings: {
    theme: string;
    themeA11y: (name: string) => string;
    themes: {
      light: string;
      dim: string;
      dark: string;
    };
    language: string;
    languages: {
      system: string;
      en: string;
      'pt-PT': string;
    };
    data: string;
    dataBody: (n: number) => string;
    export: string;
    import: string;
    importHint: string;
    version: (version: string, build: string) => string;
    exportFailed: string;
    importFailed: string;
    importDone: string;
    importDoneBody: (n: number) => string;
    shareDialog: string;
  };
  backupErrors: {
    notJson: string;
    notExport: string;
    newer: string;
    invalid: string;
    unavailable: string;
  };
  voiceSettings: {
    title: string;
    body: string;
    hide: string;
    show: string;
    noQuotes: string;
    quoteCount: (n: number, own: boolean) => string;
    edit: (name: string) => string;
    editorTitle: (name: string) => string;
    editorBody: string;
    editorPlaceholder: string;
    restore: string;
    restoreTitle: string;
    restoreBody: string;
    restoreConfirm: string;
  };
  unlockSettings: {
    title: string;
    body: string;
    unsupported: string;
    accessTitle: string;
    accessBody: string;
    accessOff: string;
    openAccess: string;
  };
  stepSettings: {
    title: string;
    body: string;
    unsupported: string;
    askTitle: string;
    askBody: string;
    deniedTitle: string;
    deniedBody: string;
    startFailedTitle: string;
    startFailedBody: string;
    failed: string;
    permissionOff: string;
  };
  habitSettings: {
    title: string;
    noneTracked: string;
    body: string;
    reduceSummary: (weight: number) => string;
    growSummary: (weight: number) => string;
    edit: string;
    track: (name: string) => string;
    name: string;
    price: string;
    usual: string;
    heavyPoints: string;
    lightPoints: string;
    options: string;
    removeOption: (label: string) => string;
    optionPlaceholder: string;
    addHabit: string;
    habitPlaceholder: string;
    toGrow: string;
    toReduce: string;
    inPrompt: string;
  };
  /** Names of the preset habits, shown while you haven't renamed them. */
  presets: Record<
    string,
    {
      name: string;
      unit: string;
    }
  >;
  presetOptions: Record<string, string>;
  /** The Claude prompt. Claude answers in the language it's asked in. */
  prompt: {
    intro: (first: string, last: string) => string;
    scale: string;
    notLogged: string;
    unlocks: (n: number) => string;
    steps: (n: number) => string;
    habits: (text: string) => string;
    logged: (logged: number, possible: number) => string;
    averages: (perSlot: string, overall: string) => string;
    averageUnlocks: (n: number) => string;
    averageSteps: (n: number) => string;
    signalUnlocks: string;
    signalSteps: string;
    signalHabits: string;
    habitsTitle: string;
    habitGrow: (name: string, wins: number, logged: number) => string;
    habitReduce: (name: string, wins: number, logged: number, total: number, unit: string) => string;
    habitMoods: (none: string, some: string) => string;
    balance: (light: number, heavy: number) => string;
    saved: (amount: string) => string;
    instead: (notes: string) => string;
    loops: string;
    about: string;
    did: (what: string) => string;
    insteadNote: (note: string) => string;
    answerIn: string;
  };
  /** Each voice's words; its emojis and bursts don't change with the language. */
  voices: Record<VoiceId, VoiceText>;
};
