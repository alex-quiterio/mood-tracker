import type { QuickMood } from '@domain/reminders/quickCheckIn';
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
    history: string;
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
    /** When a check-in was saved: a long date and an HH:MM time. */
    loggedAt: (date: string, time: string) => string;
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
    cellA11y: (date: string, slot: string, detail: string) => string;
    moodDetail: (mood: number) => string;
    unlocksDetail: (n: number) => string;
    stepsDetail: (n: number) => string;
  };
  calendar: {
    previousMonth: string;
    nextMonth: string;
    dayA11y: (date: string, count: number) => string;
    dayTotal: (totals: string) => string;
    editDay: string;
    doneEditing: string;
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
  spending: {
    title: string;
    thisWeek: (amount: string) => string;
    inAll: (amount: string) => string;
    perHabit: (emoji: string, amount: string) => string;
    setPrice: string;
  };
  history: {
    calendar: string;
  };
  progress: {
    title: string;
    level: (n: number) => string;
    toNext: (xp: string) => string;
    total: (xp: string) => string;
    levelUp: (title: string) => string;
    a11y: (level: number, title: string, into: string, size: string) => string;
    sources: {
      checkIn: (n: number) => string;
      note: (n: number) => string;
      fullDay: (n: number) => string;
      win: (n: number) => string;
      urgePassed: (n: number) => string;
      streakWeek: (n: number) => string;
    };
    path: string;
    fromLevel: (n: number) => string;
    hint: string;
  };
  month: {
    title: string;
    hint: string;
    notEnough: string;
    best: (weekday: string, average: string) => string;
    hardest: (weekday: string, average: string) => string;
    lowestSlot: (slot: string, average: string) => string;
    habitMoods: (emoji: string, name: string, none: string, some: string) => string;
    reflect: string;
    reflectHint: string;
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
  urge: {
    button: string;
    pickTitle: string;
    breatheTitle: (habit: string) => string;
    breatheHint: string;
    outcomeTitle: string;
    outcomeHint: string;
    letPass: string;
    hadOne: string;
    passedTitle: string;
    passedBody: (points: number) => string;
    hadOneTitle: string;
    hadOneBody: string;
    done: string;
    floorHint: (n: number) => string;
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
    /** Labels of the mood buttons on the notification (Android shows three). */
    quickMoods: Record<QuickMood, string>;
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
    timeZone: string;
    timeZoneAuto: (zone: string) => string;
    timeZoneHint: string;
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
  widget: {
    pause: string;
    slotEmpty: (slot: string) => string;
    slotDone: (slot: string, mood: string) => string;
  };
  backupSettings: {
    folder: (name: string) => string;
    noFolder: string;
    chooseFolder: string;
    changeFolder: string;
    folderHint: string;
    backUpNow: string;
    done: string;
    doneBody: (file: string, folder: string) => string;
    failed: string;
    failedBody: string;
    auto: string;
    autoBody: string;
    last: (date: string) => string;
    never: string;
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
    rotation: string;
    rotations: { off: string; daily: string; weekly: string };
    rotationBody: string;
    today: (name: string) => string;
    inRotationA11y: (name: string) => string;
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
    showSpending: string;
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
    sleep: (text: string) => string;
    sleepHours: (hours: string) => string;
    sleepQuality: (quality: number) => string;
    sleepWeek: (hours: string, quality: string) => string;
    sleepMoods: (good: string, short: string) => string;
    answerIn: string;
    monthIntro: (first: string, last: string) => string;
    monthPatterns: string;
    monthBest: (weekday: string, average: string) => string;
    monthHardest: (weekday: string, average: string) => string;
    monthLowestSlot: (slot: string, average: string) => string;
    monthHabitMoods: (name: string, none: string, some: string) => string;
    monthAsk: string;
  };
  sleep: {
    title: string;
    quality: Record<1 | 2 | 3 | 4 | 5, string>;
    hoursLabel: string;
    hours: (hours: string) => string;
    fewerHours: string;
    moreHours: string;
    perNight: string;
  };
  lock: {
    title: string;
    body: string;
    unavailable: string;
    prompt: string;
    lockedTitle: string;
    lockedBody: string;
    unlock: string;
    confirmTitle: string;
  };
  /** Each voice's words; its emojis and bursts don't change with the language. */
  voices: Record<VoiceId, VoiceText>;
};
