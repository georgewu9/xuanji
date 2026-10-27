/* ============================================================
   XUANJI · 玄机 — bilingual copy and reading logic
   Every string is a pair: { en, zh }
   ============================================================ */
(function (global) {
  'use strict';

  const L = (en, zh) => ({ en, zh });
  const S = global.Xuanji;
  const { STEMS, STEM_PY, BRANCHES, BRANCH_PY, ANIMALS, ANIMALS_ZH, ELEMENTS, ELEMENT_ZH, HIDDEN, mod } = S;

  /* ---------------- interface strings ---------------- */

  const UI = {
    langLabel: L('EN', '中'),
    intro: {
      eyebrow: L('THE OBSERVATORY · EST. HAN DYNASTY', '观星台 · 汉制'),
      title: L('The Eastern Oracle', '东方命理'),
      sub: L('Four pillars. Eight characters. One life, waiting to be read.', '四柱八字，写你一生的来路与去处。'),
      meta: L('Five questions · about four minutes', '五问 · 约四分钟'),
      cta: L('Begin the reading', '开始测算'),
      scroll: L('For reflection, not prediction', '仅供观照，不作定论')
    },
    guideName: L('The Keeper', '守卷人'),
    steps: L('Question {n} of 5', '第 {n} 问 · 共五问'),
    back: L('Back', '返回'),
    next: L('Continue', '继续'),
    skip: L('Remain unnamed', '暂不留名'),
    edit: L('change', '修改'),
    name: {
      q: L('Before the chart is drawn — by what name shall the stars know you?', '落笔之前，先问一句：星辰该如何称呼你？'),
      ph: L('Your name', '你的名字'),
      hint: L('Optional. Leave it blank and remain a mystery.', '选填。留白，也是一种身份。')
    },
    date: {
      q: L('Now the day the world first felt your weight. When were you born?', '那么，世界第一次感到你重量的那天——你生于何时？'),
      hint: L('Date of birth', '出生日期'),
      manual: L('Keyboard', '键盘输入'),
      picker: L('Calendar', '日历选择')
    },
    time: {
      q: L('And at what hour? The old readers kept time by incense and shadow.', '又是哪一个时辰？古人以香与影计时。'),
      hint: L('Time of birth', '出生时间')
    },
    gender: {
      q: L('The sky reads polarity as well as pattern. How were you received into the world?', '天有阴阳，命有刚柔。你以何种身份来到人间？'),
      f: L('Female', '女'),
      m: L('Male', '男'),
      fSub: L('Yin · 坤', '坤 · 阴'),
      mSub: L('Yang · 乾', '乾 · 阳')
    },
    place: {
      q: L('Where did the sky first open above you? A city is enough — the hour needs its longitude.', '你出生在何处？写下城市即可——时辰需要经度。'),
      ph: L('City of birth', '出生城市'),
      hint: L('City · used to place the hour in the sky', '城市 · 用于校正时辰'),
      tz: L('Time zone', '时区'),
      tzAuto: L('Detected from city', '依城市自动匹配')
    },
    confirm: {
      q: L('Let me repeat it back to you. If it is true, we will open the sky.', '我复述一遍。若一切无误，便为你开天。'),
      title: L('The particulars', '生辰信息'),
      cast: L('Cast the chart', '起盘测算'),
      labels: {
        name: L('Name', '姓名'),
        unnamed: L('Unnamed', '未留名'),
        date: L('Birth date', '出生日期'),
        time: L('Birth hour', '出生时辰'),
        gender: L('Gender', '性别'),
        place: L('Birthplace', '出生地'),
        female: L('Female', '女'),
        male: L('Male', '男')
      }
    },
    casting: {
      title: L('Opening the sky', '开天起盘'),
      lines: [
        L('Aligning the ten heavenly stems', '校准十天干'),
        L('Weighing the five elements', '称量五行'),
        L('Turning the twelve earthly branches', '推转十二地支'),
        L('Inking the four pillars', '落墨四柱')
      ],
      done: L('The chart is drawn', '命盘已成')
    },
    nav: {
      prev: L('Previous', '上一页'),
      next: L('Next chapter', '下一章'),
      restart: L('Begin again', '重新测算'),
      print: L('Keep a copy', '保存此卷'),
      chapters: L('Chapters', '章目'),
      of: L('of', '/')
    },
    chapters: [
      { id: 'chart', label: L('The Chart', '天盘') },
      { id: 'self', label: L('The Self', '本性') },
      { id: 'health', label: L('Health', '身体') },
      { id: 'heart', label: L('The Heart', '情缘') },
      { id: 'fortune', label: L('Fortune', '财禄') },
      { id: 'cycles', label: L('Cycles', '流年') },
      { id: 'care', label: L('Care', '慎言') },
      { id: 'scroll', label: L('The Scroll', '总览') }
    ],
    chart: {
      eyebrow: L('CHAPTER I · THE FOUR PILLARS', '第一章 · 四柱'),
      title: L('The Chart of Heaven', '天盘初现'),
      lede: L('This is the sky at the moment you arrived — four pillars, eight characters, one life to unfold.', '这是你抵达人间那一刻的天色——四柱八字，一生由此展开。'),
      born: L('Born {date} at {time} · {place}', '生于 {date} {time} · {place}'),
      year: L('Year', '年柱'),
      month: L('Month', '月柱'),
      day: L('Day', '日柱'),
      hour: L('Hour', '时柱'),
      self: L('Self', '日主'),
      stem: L('Heavenly stem', '天干'),
      branch: L('Earthly branch', '地支'),
      animal: L('Animal', '生肖'),
      dayMaster: L('Your Day Master', '你的日主'),
      dayMasterNote: L('The character of your birth day — the grain of the wood, the nature you were born with.', '出生当日的天干，是你性情的底色、与生俱来的质地。'),
      balance: L('The five elements', '五行分布'),
      balanceNote: L('Not a score. A weather map — what you have in abundance, and what you must borrow.', '不是分数，而是一张天气图：你丰盈什么，又该向何处借力。'),
      season: L('You were born in {season}, when {element} ruled the sky.', '你生于{season}，彼时{zh}气当令。'),
      strength: {
        strong: L('Your Day Master stands strong in this chart — you have more than enough of yourself.', '日主偏旺——你身上的“自己”足够多。'),
        balanced: L('Your Day Master stands balanced — you are neither starved nor overfull.', '日主中和——不饥不盈，气息匀停。'),
        weak: L('Your Day Master stands lightly — you draw strength from others and from the right conditions.', '日主偏弱——你的力量来自他人，也来自合宜的时地。')
      },
      leap: L('Read on', '继续')
    },
    self: {
      eyebrow: L('CHAPTER II · INNER NATURE', '第二章 · 本性'),
      title: L('The Shape of You', '本来面目'),
      lede: L('The Day Master is the seed; the elements are the weather it grew in. Between the two, a temperament takes form.', '日主是种子，五行是它生长的天气。两者之间，性情成形。'),
      core: L('The core', '底色'),
      weather: L('The weather', '气候'),
      others: L('Among others', '在人之间'),
      traits: L('Written in your chart', '命盘批注'),
      strengthTag: L('Day Master · {s}', '日主 · {s}')
    },
    heart: {
      eyebrow: L('CHAPTER IV · BONDS', '第四章 · 情缘'),
      title: L('Matters of the Heart', '情之所钟'),
      lede: L('In the old charts, love lives in the palace beneath your feet — the branch of your birth day.', '在古法里，姻缘住在你脚下的那座宫位——日支，夫妻宫。'),
      how: L('How you love', '你如何去爱'),
      need: L('What you need', '你需要什么'),
      friction: L('Where friction gathers', '摩擦生于何处'),
      partner: L('A partner who suits you', '与你相配的人'),
      partnerText: L('Someone whose chart runs warm with {element}. They will not complete you — they will give you the weather you cannot make yourself.', '命里{zh}气充足的人。他不必补全你，只需带来你自己造不出的那种天气。'),
      peach: L('Peach blossom sits in your chart — attraction arrives easily, and so do choices.', '命带桃花——被喜欢并不难，难的是挑选。')
    },
    fortune: {
      eyebrow: L('CHAPTER V · PROSPERITY', '第五章 · 财禄'),
      title: L('The Flow of Abundance', '财路所向'),
      lede: L('Wealth in the old texts is not only money. It is what the world willingly gives you in exchange for your nature.', '古书里的“财”不只是钱，而是世界愿意用什么东西，来交换你的天性。'),
      temper: L('Your money temperament', '你的用财之道'),
      source: L('Where it comes from', '财从何处来'),
      fields: L('Fields that suit you', '适合你的行当'),
      leak: L('Where it leaks', '何处易漏'),
      note: L('A chart shows tendency, not a bank balance. Prices, markets and choices still belong to you.', '命盘只显示倾向，不是账户余额。价格、市场与选择，仍归你自己。'),
      wealthStar: L('Wealth star', '财星'),
      present: L('present', '有'),
      absent: L('thin', '弱')
    },
    cycles: {
      eyebrow: L('CHAPTER VI · TIME', '第六章 · 时运'),
      title: L('The Turning of Cycles', '大运流年'),
      lede: L('Fortune in the East moves in ten-year tides. You are not standing still; you are standing in a tide.', '东方命理以十年为潮汐。你并非静止，你只是站在某一重潮水里。'),
      luckTitle: L('The ten-year tides', '十年大运'),
      startAge: L('Your first tide began at age {age}', '起运之年：{age}岁'),
      now: L('Now', '当下'),
      current: L('The tide you are in', '你正身处的大运'),
      years: L('The next four years', '未来四年'),
      before: L('You are still in the tide that precedes your first full cycle.', '你尚在起运之前的浅滩。'),
      ageRange: L('{from}–{to}', '{from}—{to}岁'),
      yearTone: L('A year of {tone}', '此年主“{tone}”')
    },
    care: {
      eyebrow: L('CHAPTER VII · A GENTLE WORD', '第七章 · 慎言'),
      title: L('A Gentle Word of Care', '轻叩警钟'),
      lede: L('No chart is all light. These are not curses — they are the places where the road asks you to walk more slowly.', '没有一张命盘全是光。以下不是诅咒，而是路况——提醒你在某些弯道慢一点。'),
      shadow: L('The shadow', '隐忧'),
      practice: L('The practice', '对治'),
      close: L('Forewarned is not fated. The chart describes the weather; you still choose the coat.', '知命不是认命。命盘只说天气，穿什么衣服仍由你决定。')
    },
    scroll: {
      eyebrow: L('CHAPTER VIII · THE WHOLE', '第八章 · 总览'),
      title: L('The Scroll of You', '命书总览'),
      lede: L('One page, in plain words.', '一页纸，把话说白。'),
      verdict: L('In three lines', '三句断语'),
      character: L('Character', '为人'),
      love: L('Love', '婚恋'),
      wealth: L('Wealth', '财富'),
      health: L('Body', '身体'),
      keep: L('Keep close', '随身之物'),
      colors: L('Colours', '颜色'),
      direction: L('Direction', '方位'),
      numbers: L('Numbers', '数字'),
      element: L('Element to borrow', '宜补五行'),
      mantra: L('A line to carry', '一句可带走的话'),
      restart: L('Ask the sky again', '再问一次天'),
      print: L('Save as PDF', '导出 PDF'),
      end: L('The chart ends. The life does not.', '盘到此为止，人生没有。')
    },
    footer: L('YOUR CHART IS CALCULATED FROM THE SOLAR TERMS AND THE SEXAGENARY CYCLE · FOR REFLECTION, NOT MEDICAL, LEGAL OR FINANCIAL ADVICE', '命盘依节气与干支推演 · 仅供观照，不构成医疗、法律或投资建议'),
    zodiac: L('{animal} · {zh}', '{zh} · {animal}'),
    music: {
      label: L('Music', '音乐'),
      on: L('Music on', '音乐 开'),
      off: L('Music off', '音乐 关')
    },
    zodiacPanel: {
      yourSign: L('Your sign', '你的生肖'),
      yearOf: L('Year of the {animal}', '属{animal}'),
      harmony: L('Six harmony', '六合'),
      trine: L('Trine', '三合'),
      clash: L('Clash', '相冲'),
      harm: L('Harm', '相害'),
      notes: {
        harmony: L('an ease that needs little explaining', '天然的暖意，许多话不必解释'),
        trine: L('the same rhythm; silence is comfortable', '同一节奏，安静也不尴尬'),
        clash: L('attraction and friction in one breath', '吸引与摩擦，在同一口气里'),
        harm: L('a slow drain; affection alone will not fix the details', '慢慢消耗；仅有好感，解决不了细节')
      },
      note: L('Old folk correspondences. A whole chart speaks louder than a single sign.', '民间说法。一张完整的命盘，比一个生肖更有分量。')
    },
    health: {
      eyebrow: L('CHAPTER III · THE BODY', '第三章 · 身体'),
      title: L('The Body You Live In', '寄身之器'),
      lede: L('In the old charts the body speaks first: the five elements are weather not only for the mind, but for the organs that carry it.', '在古法里，身体先开口：五行不只是心情的天气，也是脏腑的天气。'),
      constitution: L('Your constitution', '你的体质'),
      season: L('You were born in {season}, when {element} ruled the sky — your body learned that weather first.', '你生于{season}，彼时{zh}气当令——你的身体最先学会的是那种天气。'),
      organs: L('The five organs', '五行与脏腑'),
      organsNote: L('A map of correspondences, not a diagnosis.', '这是一张对应图，不是诊断书。'),
      watch: L('Where to pay attention', '留意之处'),
      thin: L('What runs thin', '不足之处'),
      full: L('What runs full', '偏旺之处'),
      practice: L('Daily care', '日常养护'),
      sleep: L('Sleep', '睡眠'),
      food: L('Food', '饮食'),
      move: L('Movement', '运动'),
      disclaimer: L('Traditional five-element correspondences, offered for reflection — not medical advice. If something hurts, see a doctor.', '以上为传统五行对应，仅供观照，不构成医疗建议。身体不适，请就医。'),
      status: {
        low: L('thin', '不足'),
        mid: L('even', '平和'),
        high: L('full', '偏旺')
      }
    },
    genders: { female: L('Female', '女'), male: L('Male', '男') }
  };

  /* ---------------- day masters ---------------- */

  const DM = [
    {
      name: L('Yang Wood', '阳木'), epithet: L('The Tall Tree', '参天大树'), pinyin: 'Jiǎ',
      essence: L('You grow toward the light and expect the world to make room.', '向上生长，也期待世界为你让路。'),
      body: L(`Yang Wood is the tree that breaks the soil and keeps climbing: principled, visible, built for the long horizon. You are at your best building something that will outlast you — a company, a body of work, a family name. The shadow is stiffness: the tree that will not bend in the storm is the one that snaps.`,
        `阳木是破土而上的树：有原则、有担当，目光总在远处。你最好的状态，是在建造比自己更长久的东西——一门事业、一部作品、一个家族的名字。阴影是僵硬：风暴里不肯弯腰的树，往往最先折断。`),
      traits: [L('Principled', '有原则'), L('Ambitious', '有野心'), L('Generous', '慷慨'), L('Unbending', '不轻易折腰')],
      mantra: L('Grow slowly. Deep roots outlast tall branches.', '慢些长。深根比高枝活得久。')
    },
    {
      name: L('Yin Wood', '阴木'), epithet: L('The Vine', '藤萝'), pinyin: 'Yǐ',
      essence: L('You survive by bending, and you rarely break.', '你靠柔软活下来，极少折断。'),
      body: L(`Yin Wood is the vine: adaptive, charming, quietly relentless. You read a room before you enter it, and you find the path of least resistance without ever losing the destination. The shadow is over-accommodation — a vine that wraps too tightly can strangle what it loves, including itself.`,
        `阴木是藤：柔韧、讨喜，安静地不肯放弃。你进门之前已经读完整个房间，总能找到阻力最小的路，却从不忘记要去哪里。阴影是过度迁就——缠得太紧的藤，会勒住所爱，也包括自己。`),
      traits: [L('Adaptable', '善变通'), L('Charming', '有亲和力'), L('Persistent', '韧性强'), L('Yielding', '肯退让')],
      mantra: L('Bend, but keep a spine. Not every wall deserves your ivy.', '可以绕，但要有骨。不是每面墙都值得你攀附。')
    },
    {
      name: L('Yang Fire', '阳火'), epithet: L('The Sun at Noon', '正午之日'), pinyin: 'Bǐng',
      essence: L('You do not enter a room; you illuminate it.', '你不是走进一个房间，你是照亮它。'),
      body: L(`Yang Fire is the sun at noon: warm, open-handed, impossible to ignore. You give energy away naturally and people gather in your light. The shadow is burnout — the sun does not know how to be off duty, and you can mistake being needed for being loved.`,
        `阳火是正午的太阳：热烈、慷慨，无法被忽视。你天生向外给能量，人们也会向你的光聚拢。阴影是燃尽——太阳不懂得下班，你也容易把“被需要”误认成“被爱”。`),
      traits: [L('Radiant', '明亮'), L('Generous', '慷慨'), L('Direct', '直接'), L('Restless', '停不下来')],
      mantra: L('The sun sets on purpose. Learn to set.', '太阳是有意落山的。学着落下。')
    },
    {
      name: L('Yin Fire', '阴火'), epithet: L('The Candle', '一灯如豆'), pinyin: 'Dīng',
      essence: L('Small flame, long night, faithful light.', '小火，长夜，不肯熄灭的光。'),
      body: L(`Yin Fire is the candle: intimate, focused, and far more powerful than its size suggests. You warm the few people you let close, and you notice what others miss in the half-dark. The shadow is mood — a flame that reads every draft as a verdict, and can dim itself to keep the peace.`,
        `阴火是烛：亲近、专注，比它的体量更有力量。你只温暖少数被你放进心里的人，也常在半暗处看见别人看不见的东西。阴影是情绪——一点风就被读成判决，也可能为了息事宁人而把自己调暗。`),
      traits: [L('Intuitive', '直觉强'), L('Warm', '温暖'), L('Sensitive', '敏感'), L('Devoted', '重情')],
      mantra: L('You are allowed to burn for yourself.', '你也可以只为自己亮着。')
    },
    {
      name: L('Yang Earth', '阳土'), epithet: L('The Mountain', '山岳'), pinyin: 'Wù',
      essence: L('You are the ground other people build on.', '你是别人赖以立足的地面。'),
      body: L(`Yang Earth is the mountain: steady, protective, slow to promise and slower to leave. People trust you with weight because you do not flinch under it. The shadow is immovability — when the terrain changes, the mountain can mistake stubbornness for principle.`,
        `阳土是山：沉稳、可靠，不轻易许诺，更不轻易离开。别人愿意把重量交给你，因为你从不因重压而退缩。阴影是不动——当地形变了，山容易把固执误当成原则。`),
      traits: [L('Steadfast', '稳'), L('Protective', '护短'), L('Practical', '务实'), L('Immovable', '难转弯')],
      mantra: L('A mountain that will not move is also a mountain that cannot follow.', '不肯挪动的山，也走不到别的风景里。')
    },
    {
      name: L('Yin Earth', '阴土'), epithet: L('The Field', '田园'), pinyin: 'Jǐ',
      essence: L('You feed what you love, often before feeding yourself.', '你喂养所爱，常常先于喂养自己。'),
      body: L(`Yin Earth is the cultivated field: patient, practical, quietly fertile. You turn small daily acts into something that sustains a whole household. The shadow is self-erasure — soil that gives everything to the harvest and is left bare, then resents the harvest for taking.`,
        `阴土是耕过的田：耐心、务实，安静地丰饶。你把日复一日的小事，变成能养活一整个家的东西。阴影是自我抹除——把一切都交给收成的土，最后光秃了，又暗暗怨收成拿得太多。`),
      traits: [L('Nurturing', '会照顾人'), L('Practical', '务实'), L('Loyal', '长情'), L('Self-effacing', '习惯退后')],
      mantra: L('Fallowness is not failure. A field must rest.', '休耕不是荒废。田也要歇。')
    },
    {
      name: L('Yang Metal', '阳金'), epithet: L('The Blade', '百炼之刃'), pinyin: 'Gēng',
      essence: L('You would rather be useful than agreeable.', '你宁愿有用，也不愿只讨人喜欢。'),
      body: L(`Yang Metal is the forged blade: decisive, loyal, allergic to pretense. You cut through noise and say the thing everyone was avoiding. The shadow is sharpness without a sheath — accuracy delivered without warmth lands as a wound, and you can win the argument while losing the room.`,
        `阳金是锻好的刀：果决、重义，对虚伪过敏。你能一刀切开噪音，说出所有人都在回避的话。阴影是无鞘的锋利——没有温度的正确也是伤，你可能赢了道理，却输掉整个房间。`),
      traits: [L('Decisive', '果决'), L('Loyal', '重义'), L('Blunt', '口直'), L('Combative', '好胜')],
      mantra: L('A blade is only noble when it knows when not to cut.', '刀的高贵，在于知道何时不出鞘。')
    },
    {
      name: L('Yin Metal', '阴金'), epithet: L('The Jewel', '珠玉'), pinyin: 'Xīn',
      essence: L('You refine until the ordinary becomes precious.', '你把寻常打磨成珍贵。'),
      body: L(`Yin Metal is the jewel: precise, aesthetic, quietly proud. You have an exacting eye and a taste that improves everything it touches. The shadow is perfectionism — the jewel examines itself under every light, and can polish away the very warmth that made it lovable.`,
        `阴金是珠玉：精细、审美、安静地骄傲。你有一双苛刻的眼睛，凡经你手的东西都会变好。阴影是完美主义——珠玉在每一束光下审视自己，也可能磨掉那点让它可爱的温度。`),
      traits: [L('Refined', '讲究'), L('Discerning', '眼毒'), L('Elegant', '体面'), L('Self-critical', '苛待自己')],
      mantra: L('Let one thing be unfinished and still beautiful.', '允许某件事未完成，也依然好看。')
    },
    {
      name: L('Yang Water', '阳水'), epithet: L('The Ocean', '江海'), pinyin: 'Rén',
      essence: L('You cover distance no one else can see.', '你走过的路，别人看不见。'),
      body: L(`Yang Water is the ocean: expansive, strategic, allergic to cages. You think in currents and long games, and you can move through the world without leaving a door open behind you. The shadow is restlessness — depth that never settles can look like distance, and those who love you may never quite hold you.`,
        `阳水是海：辽阔、有谋略，天生抗拒牢笼。你以洋流和长局思考，穿过世界时身后常常不留一扇门。阴影是不安——从不停下的深水容易被看成疏远，爱你的人也许始终握不住你。`),
      traits: [L('Expansive', '开阔'), L('Strategic', '善谋'), L('Free', '不受拘束'), L('Elusive', '难以捉摸')],
      mantra: L('The ocean is not less free for choosing a shore.', '海选了岸，并不因此失去自由。')
    },
    {
      name: L('Yin Water', '阴水'), epithet: L('The Rain', '细雨'), pinyin: 'Guǐ',
      essence: L('You arrive quietly and reach the roots.', '你安静地来，一直抵达根部。'),
      body: L(`Yin Water is the rain: subtle, perceptive, quietly persistent. You understand people by absorption rather than interrogation, and your intuition often arrives before your reasons do. The shadow is moodiness — rain that will not stop can flood the very ground it was feeding, and silence is your favourite weapon.`,
        `阴水是雨：细微、通透，安静地坚持。你靠感受而不是盘问去理解别人，直觉总比理由先到。阴影是阴郁——停不下来的雨会淹掉它本来滋养的土地，而沉默是你最顺手的武器。`),
      traits: [L('Perceptive', '通透'), L('Gentle', '柔和'), L('Intuitive', '直觉准'), L('Brooding', '易内耗')],
      mantra: L('Say the thing. The rain does not have to become fog.', '把话说出来。雨不必总是下成雾。')
    }
  ];

  /* ---------------- five elements ---------------- */

  const ELEMENT = [
    {
      name: L('Wood', '木'), zh: '木', key: 'wood', verb: L('Growth', '生发'), adj: L('Growing', '生长'),
      colors: [{ hex: '#6f8f6a', en: 'Moss', zh: '苔绿' }, { hex: '#a8b98a', en: 'Bamboo', zh: '竹青' }, { hex: '#2f4b3f', en: 'Pine', zh: '松墨' }],
      direction: L('East', '东方'), numbers: '3 · 8',
      strong: L(`Wood runs strong in you: made for growth, learning, and starting things. You think in branches and possibilities, and stagnation feels physically wrong. At this volume the risk is over-extension — too many shoots, not enough root.`,
        `木气偏旺：你为生长、学习与开创而生。你以枝杈和可能性思考，停滞会让你浑身不适。木太盛的风险是摊得太开——枝多根浅。`),
      weak: L(`Wood is thin in your chart: beginnings do not come naturally, and you may wait for permission longer than you should. You are not uncreative — you simply need a first step planted for you. Long projects reward you once they are under way.`,
        `木气偏弱：开始一件事对你并不自然，你等待许可的时间往往太长。你不是没有创造力，只是需要有人替你种下第一步。一旦上路，长线的事会回报你。`),
      fields: L('teaching, publishing, design, medicine, anything that grows something from nothing', '教育、出版、设计、医药，以及一切从无到有地培育事物的工作'),
      health: L('liver, eyes, tendons, and the kind of tiredness that sleep does not fix', '肝、眼、筋，以及那种睡再多也缓不过来的疲惫'),
      organ: L('liver · eyes · tendons', '肝 · 目 · 筋'),
      excess: L('When Wood runs over, the body tightens: headaches, a clenched jaw, and plans that multiply faster than they can be finished.', '木气过旺时，身体会绷紧：头痛、咬牙，计划增生得比完成得更快。'),
      care: [
        L('Asleep before 23:00 — the quiet hours do the repairing.', '在 23 点前入睡——修复发生在安静的那几个小时。'),
        L('More greens and a little sour; less alcohol after dark.', '多吃绿叶与微酸，入夜后少喝酒。'),
        L('Walk and stretch more than you lift; loosen the hips and the jaw.', '多走路、多拉伸，少硬扛重量；松开胯与下颌。')
      ],
      practice: L('one long project instead of five new ones; walk among actual trees; go to bed before midnight', '把五个新念头收束成一个长项目；去真的树下走走；在午夜前睡')
    },
    {
      name: L('Fire', '火'), zh: '火', key: 'fire', verb: L('Radiance', '光热'), adj: L('Radiant', '明亮'),
      colors: [{ hex: '#b4462f', en: 'Cinnabar', zh: '朱砂' }, { hex: '#d98a4e', en: 'Ember', zh: '余烬' }, { hex: '#d8b26a', en: 'Antique gold', zh: '古金' }],
      direction: L('South', '南方'), numbers: '2 · 7',
      strong: L(`Fire runs strong: visible, warm, quick to act. You lead by atmosphere rather than instruction, and your enthusiasm is genuinely contagious. At this volume the risk is burning the wick at both ends — intensity that cannot be sustained, and a temper that arrives before the thought.`,
        `火气偏旺：显眼、温暖、行动极快。你靠气氛而不是指令带人，热情是真的会传染。火太盛的风险是两头烧——强度难以持续，脾气总比思考先到。`),
      weak: L(`Fire is thin: you may keep your warmth behind glass, and enthusiasm can feel like a performance you are not always up for. Joy, for you, is a practice rather than a default. You do best with people who light the room first and let you warm up.`,
        `火气偏弱：你的温度常隔着一层玻璃，热情有时像一场并不总能演好的戏。对你来说，快乐是需要练习的，而不是默认状态。最适合你的，是那些先点亮房间、让你慢慢暖起来的人。`),
      fields: L('performance, hospitality, marketing, leadership, food, anything that asks you to be seen', '表演、餐饮、传播、领导、食物，以及一切需要你被看见的行业'),
      health: L('heart, circulation, sleep, and anxiety that disguises itself as ambition', '心、循环、睡眠，以及伪装成野心的焦虑'),
      organ: L('heart · blood vessels · sleep', '心 · 血脉 · 睡眠'),
      excess: L('When Fire runs over, the system cannot come down: insomnia, palpitations, and a mind that keeps the lights on.', '火气过旺时，身体降不下来：失眠、心悸，脑子一直开着灯。'),
      care: [
        L('Dim the room an hour before bed; leave the phone outside.', '睡前留一小时把光调暗，把手机留在门外。'),
        L('Warm, simple meals; no caffeine after noon, no alcohol at night.', '温热简单的饭食；午后不碰咖啡因，夜里不饮酒。'),
        L('Steady cardio rather than intervals; end with five slow breaths.', '做匀速有氧，而不是间歇冲刺；结束前做五次慢呼吸。')
      ],
      practice: L('one evening a week with no audience; sunlight on your skin; say “I am tired” before your body says it', '每周留一个没有观众的夜晚；让阳光落在皮肤上；在身体开口之前先说“我累了”')
    },
    {
      name: L('Earth', '土'), zh: '土', key: 'earth', verb: L('Foundation', '承载'), adj: L('Grounded', '厚重'),
      colors: [{ hex: '#b08d57', en: 'Ochre', zh: '赭石' }, { hex: '#a9765a', en: 'Clay', zh: '陶土' }, { hex: '#ded0b4', en: 'Sand', zh: '沙白' }],
      direction: L('Centre · Southwest', '中央 · 西南'), numbers: '5 · 10',
      strong: L(`Earth runs strong: you are the load-bearing wall — reliable, practical, slow to panic. You metabolise other people's chaos and turn it into a plan. At this volume the risk is over-responsibility: you carry what was never yours, and call it love.`,
        `土气偏旺：你是承重墙——可靠、务实、不易惊慌。你把别人的混乱消化成计划。土太盛的风险是过度负责：你扛起本不属于你的重量，还把它叫作爱。`),
      weak: L(`Earth is thin: routine and rootedness can feel like a cage, and you may live in your head more than in your body. You do not lack discipline — you lack a stable base from which discipline is easy. Small daily rituals will do more for you than grand resolutions.`,
        `土气偏弱：规律与扎根有时像牢笼，你活在心里多过活在身上。你不缺自律，缺的是一个让自律变容易的稳定基座。日常的小仪式，比宏大的决心更救你。`),
      fields: L('property, operations, agriculture, construction, therapy, anything that must hold over time', '地产、运营、农业、建造、心理照护，以及一切必须经得住时间的东西'),
      health: L('digestion, the spleen, muscles, and worry that settles in the stomach', '消化、脾胃、肌肉，以及沉在胃里的忧思'),
      organ: L('stomach · spleen · muscles', '胃 · 脾 · 肌肉'),
      excess: L('When Earth runs over, things get heavy: sluggish digestion, weight that will not move, and worry that circles the same room.', '土气过旺时，一切会变沉：消化迟滞、体重不动、忧虑在同一个房间里打转。'),
      care: [
        L('Regular hours beat long ones — wake at the same time, even on Sundays.', '规律比时长重要——包括周日，也在同一时间醒来。'),
        L('Warm, cooked food, eaten seated and slowly; stop at eight-tenths.', '吃温热的熟食，坐着慢慢吃；八分饱就停。'),
        L('Strength work and walking; never train on an empty stomach.', '力量训练加走路；不要空腹训练。')
      ],
      practice: L('eat at a table, not at a desk; finish one thing before starting the next; let someone else carry it for once', '在餐桌吃饭，不在案头；做完一件再开下一件；偶尔让别人来扛')
    },
    {
      name: L('Metal', '金'), zh: '金', key: 'metal', verb: L('Structure', '收敛'), adj: L('Precise', '精准'),
      colors: [{ hex: '#c9cdd4', en: 'Silver', zh: '银白' }, { hex: '#efe7d8', en: 'Ivory', zh: '象牙' }, { hex: '#7d8794', en: 'Steel', zh: '钢青' }],
      direction: L('West', '西方'), numbers: '4 · 9',
      strong: L(`Metal runs strong: precise, principled, quietly competitive. You value what holds its shape under pressure — contracts, craft, standards. At this volume the risk is rigidity: a standard so high that nothing and no one can meet it, including you.`,
        `金气偏旺：精确、有原则，安静地好胜。你看重那些在压力下仍不变形的东西——契约、手艺、标准。金太盛的风险是僵硬：标准高到无人能及，包括你自己。`),
      weak: L(`Metal is thin: boundaries and endings are harder for you than beginnings. You may say yes when you mean no, and only discover the cost later. Structure is not a cage for you — it is the gift that makes your generosity sustainable.`,
        `金气偏弱：对你而言，划界和结束比开始更难。你常在该说“不”的时候说“好”，代价要很久以后才发现。结构对你不是牢笼，而是让你的慷慨得以持续的那份礼物。`),
      fields: L('law, engineering, finance, surgery, editing, craft, anything that rewards exactness', '法律、工程、金融、外科、编辑、工艺，以及一切奖励精确的领域'),
      health: L('lungs, skin, grief, and the boundaries you never learned to draw', '肺、皮肤、悲伤，以及你始终没学会划下的那条界'),
      organ: L('lungs · skin · breath', '肺 · 皮肤 · 呼吸'),
      excess: L('When Metal runs over, things dry out: a tight chest, reactive skin, and a mind that cannot stop editing.', '金气过旺时，一切会变干：胸口发紧、皮肤敏感，脑子停不下来地修改。'),
      care: [
        L('Sleep with the window cracked; keep the bedroom cool and not dry.', '睡觉时留一条窗缝；卧室保持凉爽而不干燥。'),
        L('Pears, radish, enough water; less fried and dry food.', '梨、萝卜、足够的水；少吃油炸与干燥之物。'),
        L('Breathe through the nose, slowly; open the chest; never hold your breath under effort.', '用鼻子慢慢呼吸，打开胸腔；用力时不要憋气。')
      ],
      practice: L('practise saying no in low-stakes places; finish what is finished; grieve on purpose instead of storing it', '在小事上练习说不；该结束的就让它结束；有意识地悲伤，而不是囤积')
    },
    {
      name: L('Water', '水'), zh: '水', key: 'water', verb: L('Flow', '流动'), adj: L('Fluid', '灵动'),
      colors: [{ hex: '#1f2a3a', en: 'Ink', zh: '墨蓝' }, { hex: '#3f5f73', en: 'Deep sea', zh: '深海' }, { hex: '#cfd9df', en: 'Moon', zh: '月白' }],
      direction: L('North', '北方'), numbers: '1 · 6',
      strong: L(`Water runs strong: perceptive, strategic, hard to corner. You understand systems and people by moving through them, and you rarely show your full hand. At this volume the risk is drifting: endless optionality can become an excuse not to commit.`,
        `水气偏旺：通透、有谋略，难以被围住。你靠穿行其中来理解系统与人，很少亮出全部底牌。水太盛的风险是漂流：无限的选择，会成为不承诺的借口。`),
      weak: L(`Water is thin: rest, surrender and trust do not come easily, and you may push through fatigue as if it were a character flaw. Your intuition is there, but quiet. Stillness — actual, unproductive stillness — is the practice that restores you.`,
        `水气偏弱：休息、交托与信任对你都不容易，你会把疲惫当成性格缺陷硬扛过去。你的直觉是有的，只是很轻。静止——真正无所事事的静止——才是让你恢复的练习。`),
      fields: L('research, strategy, writing, counselling, trade, travel, technology', '研究、策略、写作、咨询、贸易、旅行、科技'),
      health: L('kidneys, lower back, and fear that keeps you awake at night', '肾、腰，以及让你夜里醒来的恐惧'),
      organ: L('kidneys · lower back · fear', '肾 · 腰 · 恐惧'),
      excess: L('When Water runs over, things get cold: lower-back ache, poor circulation, and fears that pool in the dark.', '水气过旺时，一切会变冷：腰酸、循环不畅，恐惧在暗处积水。'),
      care: [
        L('Sleep before midnight and keep the lower back covered.', '在午夜前睡，护住后腰。'),
        L('Warm stews, black beans, salt in moderation; no iced drinks.', '温热的炖煮、黑豆、适量的盐；不喝冰饮。'),
        L('Slow strength, walking, swimming; do not overtrain in winter.', '慢力量、走路、游泳；冬天不要过度训练。')
      ],
      practice: L('sleep before you are broken; sit by water without your phone; ask for help in plain words', '别等到垮掉才睡；不带手机去水边坐一会儿；用最直白的话开口求助')
    }
  ];

  /* ---------------- ten gods ---------------- */

  const GOD = {
    friend: {
      zh: '比肩', name: L('The Companion', '同路人'),
      text: L(`You meet the world as an equal: self-reliant, direct, uncomfortable asking for help. You build through will and repetition. The cost is that collaboration can feel like a compromise of yourself.`,
        `你以平等的姿态面对世界：自立、直接，不习惯开口求助。你靠意志和重复把事情做成。代价是，合作有时像对自我的妥协。`)
    },
    rival: {
      zh: '劫财', name: L('The Rival', '竞争者'),
      text: L(`You are wired for contest — you sharpen against opposition and hate to lose. Charisma and appetite for risk take you far. Watch the impulse to gamble, and the friends who treat your resources as shared.`,
        `你天生为竞争而生——在对抗中变锋利，最恨输。魅力与冒险欲会把你带得很远。留意赌性，以及那些把你的资源当成公共财物的朋友。`)
    },
    output: {
      zh: '食神', name: L('The Artisan', '手艺人'),
      text: L(`You win people over by making things well and enjoying them. Appetite — for food, beauty, craft — is one of your engines. Your ease can shade into complacency when no one is asking anything of you.`,
        `你靠把东西做好、并真心享受它，来赢得别人。口腹、审美、手艺，都是你的引擎。当没人对你提要求时，你的从容容易滑向懒散。`)
    },
    expression: {
      zh: '伤官', name: L('The Provocateur', '破格者'),
      text: L(`You see the flaw in every system and cannot help saying so. Talent pours out of you; so does criticism. Under a good editor this is brilliance. Without one, it is the reason doors close.`,
        `你能看见每个系统里的裂缝，且忍不住要说出来。才华从你身上溢出来，批评也是。有好编辑时，这是才华；没有时，这就是门一扇扇关上的原因。`)
    },
    indirectWealth: {
      zh: '偏财', name: L('The Venture', '逐利者'),
      text: L(`Money and opportunity arrive through people, timing and nerve rather than a salary ladder. You are generous, mobile, good at the unconventional. The risk is treating the next deal as the next identity.`,
        `钱财与机会来自人、时机与胆量，而不是一条薪资阶梯。你慷慨、灵活，擅长非常规的路子。风险在于，把下一笔生意当成下一个自己。`)
    },
    directWealth: {
      zh: '正财', name: L('The Steward', '守成人'),
      text: L(`You are excellent at building and keeping — one careful brick at a time. What you own, you maintain; what you promise, you deliver. The risk is confusing security with aliveness.`,
        `你极擅长积累与守住——一块砖一块砖地来。你拥有的，你会维护；你承诺的，你会兑现。风险在于，把安全感错当成了生命力。`)
    },
    sevenKill: {
      zh: '七杀', name: L('The Commander', '掌兵者'),
      text: L(`You are drawn to pressure and perform best when the stakes are real. Authority sits naturally on you, though you may seize it before it is offered. Under stress, decisiveness can become domination.`,
        `你被压力吸引，真正下注时才发挥最好。权威天然落在你身上，只是你有时还没被授予就先伸手了。压力之下，果决容易变成掌控。`)
    },
    directOfficer: {
      zh: '正官', name: L('The Magistrate', '执规矩者'),
      text: L(`You believe in order, reputation, and doing things properly. Institutions trust you, and you tend to rise through them. The risk is becoming the rule you once resented — and measuring your life by external approval.`,
        `你相信秩序、名誉，以及把事情做“对”。体制信任你，你也常在其中上升。风险是，你变成了自己曾经厌恶的那条规矩，并用外界的认可来丈量一生。`)
    },
    indirectResource: {
      zh: '偏印', name: L('The Mystic', '独行者'),
      text: L(`You learn sideways and think in leaps. Solitude is not loneliness for you but a workshop. The risk is abstraction: beautiful theories that never touch the ground, and detachment mistaken for peace.`,
        `你从旁门学习，思维是跳跃的。独处对你不是孤独，而是工坊。风险是抽象：漂亮却从不落地的理论，以及被误认为平静的疏离。`)
    },
    directResource: {
      zh: '正印', name: L('The Scholar', '受教者'),
      text: L(`You are nourished by learning, mentors, and being cared for. You repay the world with patience and depth. The risk is staying in the student's chair — protected, prepared, and never quite beginning.`,
        `你从学习、师承与被照顾中获得滋养。你以耐心和深度回报世界。风险是一直坐在学生的位置上——被保护着、准备着，却始终没有真正开始。`)
    }
  };

  /* ---------------- spouse palace: day branches ---------------- */

  const BRANCH_LOVE = [
    {
      how: L(`You love with curiosity and a little mischief; intimacy, for you, is a conversation that never quite ends.`, `你带着好奇和一点顽皮去爱；对你而言，亲密是一场永远说不完的对话。`),
      need: L(`Someone who keeps surprising you, and never asks you to be smaller.`, `一个总能让你意外、且从不要求你缩小自己的人。`),
      friction: L(`Restlessness — you can mistake a lull for a loss and leave before the quiet has had a chance to become depth.`, `不安分——你容易把平静误当失去，在安静还没沉淀成深情之前就先离开。`)
    },
    {
      how: L(`You love slowly and completely. Trust is built in deeds, not declarations, and once given it is not easily withdrawn.`, `你爱得慢，也爱得彻底。你信行动不信宣言，一旦交出信任，就不轻易收回。`),
      need: L(`Patience, consistency, and someone who does not confuse silence with absence.`, `耐心、稳定，以及一个不会把沉默当成不在场的人。`),
      friction: L(`You can hold a grievance for years without ever raising your voice, then present the bill all at once.`, `你能把委屈存很多年而不提高声音，然后在某一天一次性结账。`)
    },
    {
      how: L(`You love with momentum — all in, no half measures. You want a partner who can keep pace and does not flinch at your appetite for life.`, `你带着冲劲去爱——全情投入，不留后手。你需要一个跟得上节奏、也不被你生命欲吓退的人。`),
      need: L(`Admiration and open space. A cage, however gilded, kills the feeling.`, `欣赏与空间。再华丽的笼子，也会让这份感情死掉。`),
      friction: L(`Boredom often arrives before betrayal does; you may leave a good thing simply because it stopped being exciting.`, `厌倦通常比背叛先到；你可能仅仅因为它不再刺激，就离开一段本来很好的关系。`)
    },
    {
      how: L(`You love with tact and tenderness, attentive to the small weather between two people.`, `你用体贴与温柔去爱，对两个人之间细微的天气格外敏感。`),
      need: L(`Gentleness, beauty, and a home that feels like a soft place to land.`, `温柔、美感，以及一个可以轻轻落地的家。`),
      friction: L(`Avoidance — you would rather keep the peace than name the problem, until the unnamed thing has grown too large to live with.`, `回避——你宁愿维持和平也不愿点破问题，直到那个没有被说出口的东西大到无法共处。`)
    },
    {
      how: L(`You love with ambition; a partnership must go somewhere, or it begins to feel like a waiting room.`, `你带着野心去爱；一段关系必须去往某处，否则就像一间候诊室。`),
      need: L(`Someone who takes your visions seriously, and is not intimidated by scale.`, `一个认真对待你的愿景、也不被格局吓退的人。`),
      friction: L(`Pride — generous in public, withholding in private; you would rather be right than be close.`, `骄傲——对外慷慨，对内封闭；你有时宁愿赢，也不愿亲近。`)
    },
    {
      how: L(`You love with intensity and discretion. You give your whole heart, but only after watching for a long time.`, `你爱得浓烈而克制。你会交出整颗心，但先要观察很久。`),
      need: L(`Loyalty and depth. Small talk will lose you; consistency will keep you.`, `忠诚与深度。寒暄留不住你，稳定才能。`),
      friction: L(`Jealousy, and the habit of testing people instead of simply telling them what you need.`, `嫉妒，以及用试探代替直说的习惯。`)
    },
    {
      how: L(`You love out loud — fast, bright, generous with affection and attention.`, `你爱得张扬——快、亮，毫不吝啬地给出爱意与注视。`),
      need: L(`Freedom and fire. Someone who runs beside you, not after you.`, `自由与火。一个与你并肩跑、而不是在后面追的人。`),
      friction: L(`Your heart changes direction at full speed, and others are left holding the map.`, `你的心会在全速中换方向，留下别人拿着旧地图。`)
    },
    {
      how: L(`You love with softness and deep loyalty; you notice what people need before they ask.`, `你以柔软和深情去爱；别人还没开口，你已经知道他们需要什么。`),
      need: L(`Emotional safety, and to be cared for as much as you care.`, `情绪上的安全，以及被同样地照顾。`),
      friction: L(`You keep the peace by swallowing the truth, then resent being unseen.`, `你靠吞下真话来维持和平，然后又因不被看见而委屈。`)
    },
    {
      how: L(`You love with wit and versatility; a partner must be a playmate before anything else.`, `你用机敏与多变去爱；伴侣首先得是玩伴。`),
      need: L(`Mental company and room to improvise.`, `精神上的同伴，以及即兴发挥的余地。`),
      friction: L(`You can talk your way around a feeling instead of feeling it, and charm your way out of an apology.`, `你会绕着一种情绪说话，而不是去感受它；也会用魅力代替道歉。`)
    },
    {
      how: L(`You love with precision and devotion, and you show it by making the shared life beautiful and correct.`, `你爱得精确而专注，通过把共同生活打理得美好、妥帖来表达。`),
      need: L(`Appreciation and a sense of order; chaos reads to you as disrespect.`, `欣赏与秩序感；混乱在你眼里近乎不尊重。`),
      friction: L(`Criticism — you correct what you love and call it care, and your partner hears something else.`, `挑剔——你修正你所爱的，并称之为关心，而对方听到的却是别的。`)
    },
    {
      how: L(`You love with loyalty and a fierce sense of duty; once you call someone yours, you do not let go.`, `你以忠诚和强烈的责任感去爱；一旦把谁当成自己人，就不松手。`),
      need: L(`Honesty and shared values. You would rather have a hard truth than a pleasant fiction.`, `诚实与共同的价值观。你宁愿要难听的真相，也不要好听的假话。`),
      friction: L(`Guardedness — you protect the door so well that no one gets in, then wonder why you are alone.`, `戒备——你把门守得太好，没人进得来，然后又不明白自己为何孤单。`)
    },
    {
      how: L(`You love with generosity and appetite; you want to feed people, host them, make life abundant.`, `你以慷慨和热情去爱；你想喂养别人、招待别人，让生活丰盛起来。`),
      need: L(`Warmth and play, and someone who does not take advantage of your giving.`, `温暖、玩心，以及一个不会利用你慷慨的人。`),
      friction: L(`You give too much too early, then feel exposed when it is not returned in kind.`, `你太早给得太多，当回报不如预期时又觉得受伤。`)
    }
  ];

  /* ---------------- zodiac relations ---------------- */

  const ZODIAC = {
    harmony: { 0: 1, 1: 0, 2: 11, 3: 10, 4: 9, 5: 8, 6: 7, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2 },
    clash: { 0: 6, 1: 7, 2: 8, 3: 9, 4: 10, 5: 11, 6: 0, 7: 1, 8: 2, 9: 3, 10: 4, 11: 5 },
    harm: { 0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 0, 8: 11, 9: 10, 10: 9, 11: 8 },
    trine: {
      0: [4, 8], 1: [5, 9], 2: [6, 10], 3: [7, 11],
      4: [0, 8], 5: [1, 9], 6: [2, 10], 7: [3, 11],
      8: [0, 4], 9: [1, 5], 10: [2, 6], 11: [3, 7]
    }
  };

  /* ---------------- helpers ---------------- */

  function displayName(chart, lang) {
    if (chart.input.name) return chart.input.name;
    return lang === 'en' ? 'Seeker' : '来访者';
  }

  function dmOf(chart) { return DM[chart.dayMaster.stem]; }
  function elOf(i) { return ELEMENT[i]; }
  function godOf(key) { return GOD[key]; }

  function pillarLabel(p, lang) {
    return lang === 'en' ? UI.chart[p.key] : UI.chart[p.key];
  }

  function formatDate(chart, lang) {
    const { y, m, d } = chart.input;
    if (lang === 'zh') return `${y}年${m}月${d}日`;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[m - 1]} ${d}, ${y}`;
  }

  function formatTime(chart, lang) {
    const { h, mi } = chart.input;
    const hh = String(h).padStart(2, '0');
    const mm = String(mi).padStart(2, '0');
    if (lang === 'zh') {
      const branch = BRANCHES[Math.floor(mod(h + 1, 24) / 2)];
      return `${hh}:${mm}（${branch}时）`;
    }
    const ampm = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mm} ${ampm}`;
  }

  /* ---------------- reading builders ---------------- */

  function personality(chart, lang) {
    const dm = dmOf(chart);
    const strongKey = chart.dayMaster.strength;
    const dom = elOf(chart.dominant);
    const weak = elOf(chart.weakest);
    const god = godOf(chart.dominantGod);
    const traits = dm.traits.map(t => t[lang]);
    traits.push(dom.adj[lang]);
    return {
      dm: {
        name: dm.name[lang],
        epithet: dm.epithet[lang],
        pinyin: dm.pinyin + ' · ' + STEMS[chart.dayMaster.stem],
        essence: dm.essence[lang],
        body: dm.body[lang]
      },
      weather: {
        title: L(`${dom.name.en} sky, thin ${weak.name.en}`, `${dom.zh}旺${weak.zh}弱`)[lang],
        strong: dom.strong[lang],
        weak: weak.weak[lang]
      },
      social: {
        name: god.name[lang] + ' · ' + god.zh,
        text: god.text[lang]
      },
      traits: traits.slice(0, 5),
      strength: UI.chart.strength[strongKey][lang]
    };
  }

  function love(chart, lang) {
    const dayBranch = chart.pillars[2].branch;
    const b = BRANCH_LOVE[dayBranch];
    const partnerEl = chart.useful;
    // partner star: officer for women, wealth for men
    const starKeys = chart.input.gender === 'female'
      ? ['directOfficer', 'sevenKill']
      : ['directWealth', 'indirectWealth'];
    const starCount = (chart.gods[starKeys[0]] || 0) + (chart.gods[starKeys[1]] || 0);
    const star = starCount >= 2.2 ? 'strong' : starCount >= 0.9 ? 'present' : 'thin';
    const starText = {
      strong: L(`The partner star is bright in your chart: relationships arrive easily, sometimes more than one at a time. The work is not finding love — it is choosing well and staying.`,
        `伴侣星在命中明亮：缘分来得容易，有时不止一段同时出现。你的功课不是找到爱，而是挑得准、留得住。`),
      present: L(`The partner star is present but not loud: love tends to arrive through ordinary circumstances, and lasts when it is built rather than discovered.`,
        `伴侣星有而不喧哗：你的缘分多在寻常处境中发生，靠经营而非靠遇见而长久。`),
      thin: L(`The partner star is quiet in your chart: love is not handed to you, and you may spend long seasons alone. What you build, you build deliberately — and it tends to be more durable than what others stumble into.`,
        `伴侣星偏静：爱不是被递到你手上的，你可能要独处很长一段季节。但你亲手建成的关系，往往比别人撞见的那种更耐久。`)
    }[star];
    return {
      how: b.how[lang],
      need: b.need[lang],
      friction: b.friction[lang],
      partner: UI.heart.partnerText[lang].replace('{element}', elOf(partnerEl).name[lang]).replace('{zh}', elOf(partnerEl).zh),
      starText: starText[lang],
      peach: chart.peach
    };
  }

  function wealth(chart, lang) {
    const wCount = (chart.gods.directWealth || 0) + (chart.gods.indirectWealth || 0);
    const strong = chart.dayMaster.strength === 'strong';
    const weak = chart.dayMaster.strength === 'weak';
    const rival = (chart.gods.friend || 0) + (chart.gods.rival || 0);
    const expr = (chart.gods.output || 0) + (chart.gods.expression || 0);
    let temper;
    if (wCount >= 2.4 && strong) {
      temper = L(`Wealth is strong and you are strong enough to hold it: you have a real instinct for value, and money tends to follow your decisions rather than your hopes. Your task is not to earn more but to build vessels that keep it — structures, partnerships, patience.`,
        `财星有力，你也担得起：你对价值有真实的嗅觉，钱多半跟着你的决定走，而不是跟着愿望走。你的功课不是赚更多，而是造出能留住它的容器——结构、伙伴、耐心。`);
    } else if (wCount >= 2.4 && weak) {
      temper = L(`Wealth is abundant but your Day Master is light: money arrives with pressure attached, and opportunity can feel like an obligation. You do best with partners and advisors who carry weight you should not carry alone. Say no earlier than is comfortable.`,
        `财旺而日主偏轻：钱来的时候，压力也一起来，机会有时更像义务。你最适合与人搭档、请人参谋，而不是独自扛下不该你扛的重量。拒绝要说得比“舒服”更早一点。`);
    } else if (wCount < 0.9) {
      temper = L(`The wealth star is thin: money was never going to be the measure of your life. What you earn tends to come through skill, reputation and craft rather than pursuit. Chasing it directly is the least effective way for you — becoming excellent is the most effective.`,
        `财星偏弱：钱从来不是丈量你一生的尺子。你的收入多来自手艺、名声与专业，而不是追逐。对你而言，直接追钱是最无效的路径，变得出色才是最有效的。`);
    } else {
      temper = L(`Wealth is present and steady: you earn in proportion to effort, and you are better than most at not losing what you make. Your risk is not poverty but a quiet narrowness — a life organised around safety rather than scale.`,
        `财星中和：你的收入与付出大致相称，也比多数人更守得住。你的风险不是贫穷，而是安静的狭窄——把一生安排给了安全，而不是更大的可能。`);
    }
    let leak;
    if (rival >= 3.2) leak = L(`Competition and generosity drain you: friends, siblings, peers and joint ventures are where money disappears. Lend with a contract, or not at all.`, `比劫过重：朋友、手足、同行与合伙，都是钱容易消失的地方。要借就立字据，否则别借。`);
    else if (expr >= 3.2) leak = L(`You spend on expression: tools, travel, taste, and the impulse to turn a feeling into a purchase. The leak is not reckless — it is aesthetic, and therefore harder to see.`, `你为表达花钱：工具、旅行、品味，以及把情绪变成消费的冲动。这种漏不是挥霍，而是审美性的，因此更难察觉。`);
    else if (weak) leak = L(`You undercharge. The leak is not spending but pricing — you sell your work below what it costs you to make it.`, `你定价太低。漏的不是支出，而是报价——你卖出的价格，低于它真实的成本。`);
    else leak = L(`Nothing dramatic: the usual slow leak of subscriptions, upgrades, and the belief that the next purchase will simplify your life.`, `并无大漏：只是订阅、升级，以及“下一件东西会让生活变简单”的信念，慢慢渗出去。`);

    const domEl = elOf(chart.useful);
    const fields = domEl.fields[lang].split(/[,，、]/).map(x => x.trim()).filter(Boolean);

    const short = (() => {
      if (wCount >= 2.4 && strong) return L(`wealth that follows your decisions rather than your hopes`, `钱跟着你的决定走，多于跟着愿望走。`);
      if (wCount >= 2.4 && weak) return L(`money that arrives with strings attached`, `钱来的时候，绳子也一起来。`);
      if (wCount < 0.9) return L(`a fortune built on skill and reputation rather than pursuit`, `财来自手艺与名声，而不是追逐。`);
      return L(`steady earnings, well kept`, `收入与付出相称，也守得住。`);
    })();

    return {
      temper: temper[lang], short: short[lang], leak: leak[lang], fields,
      star: wCount >= 1 ? UI.fortune.present[lang] : UI.fortune.absent[lang],
      wealthStarZh: '财'
    };
  }

  function zodiac(chart, lang) {
    const yb = chart.pillars[0].branch;
    const pack = list => list.map(b => ({ en: ANIMALS[b], zh: ANIMALS_ZH[b], branch: BRANCHES[b] }));
    const group = (key, label, list, note) => ({
      key,
      label: label[lang],
      animals: pack(list),
      note: note[lang]
    });
    return {
      animal: { en: ANIMALS[yb], zh: ANIMALS_ZH[yb], branch: BRANCHES[yb] },
      groups: [
        group('harmony', UI.zodiacPanel.harmony, [ZODIAC.harmony[yb]], UI.zodiacPanel.notes.harmony),
        group('trine', UI.zodiacPanel.trine, ZODIAC.trine[yb], UI.zodiacPanel.notes.trine),
        group('clash', UI.zodiacPanel.clash, [ZODIAC.clash[yb]], UI.zodiacPanel.notes.clash),
        group('harm', UI.zodiacPanel.harm, [ZODIAC.harm[yb]], UI.zodiacPanel.notes.harm)
      ]
    };
  }

  function health(chart, lang) {
    const constitution = {
      strong: L(`You are built to take a hit: recovery is quick, appetite is reliable, and you can carry more than most. The risk is not fragility but neglect — you can run a long way on stored momentum before you notice the cost.`,
        `你底子厚：恢复快、胃口稳，比多数人更能扛。风险不是脆弱，而是忽略——你可以在透支的惯性里跑很久，才注意到代价。`),
      balanced: L(`Your constitution is even: no single element dictates a weakness, and you tend to notice imbalance early. The risk is complacency — a body that rarely complains gets ignored when it finally does.`,
        `你的体质偏中和：没有哪一行独大，也较容易察觉失衡。风险是轻慢——一个很少抱怨的身体，终于开口时容易被忽略。`),
      weak: L(`You are fine-tuned rather than armoured: you notice what others miss, and you pay for what you ignore. Steady rhythms, early nights and unapologetic rest are not luxuries for you; they are maintenance.`,
        `你不是铠甲型，而是精密型：别人看不见的你能看见，自己忽略的却要付账。规律的作息、早睡与不带歉意的休息，对你不是奢侈，是保养。`)
    }[chart.dayMaster.strength][lang];

    const seasonEl = elOf(chart.season.element);
    const season = UI.health.season[lang]
      .replace('{season}', chart.season[lang])
      .replace('{element}', seasonEl.name[lang])
      .replace('{zh}', seasonEl.zh);

    const organs = ELEMENTS.map((e, i) => {
      const el = ELEMENT[i];
      const pct = chart.pct[i];
      const state = pct < 14 ? 'low' : pct > 26 ? 'high' : 'mid';
      return {
        key: el.key,
        name: el.name[lang],
        zh: el.zh,
        organ: el.organ[lang],
        pct,
        state,
        stateLabel: UI.health.status[state][lang]
      };
    });

    const weakEl = elOf(chart.weakest);
    const strongEl = elOf(chart.dominant);
    const useEl = elOf(chart.useful);

    const watch = [
      {
        key: 'thin',
        label: UI.health.thin[lang],
        title: lang === 'en' ? weakEl.name.en + ' · ' + weakEl.zh : weakEl.zh,
        body: lang === 'en'
          ? `Your chart runs light on ${weakEl.name.en.toLowerCase()}. In the body that often shows up as ${weakEl.health.en}.`
          : `你命中${weakEl.zh}气最薄，身体上常表现为${weakEl.health.zh}。`
      },
      {
        key: 'full',
        label: UI.health.full[lang],
        title: lang === 'en' ? strongEl.name.en + ' · ' + strongEl.zh : strongEl.zh,
        body: strongEl.excess[lang]
      }
    ];

    const care = [
      { k: UI.health.sleep[lang], text: useEl.care[0][lang] },
      { k: UI.health.food[lang], text: useEl.care[1][lang] },
      { k: UI.health.move[lang], text: useEl.care[2][lang] }
    ];

    return {
      constitution, season, organs, watch, care,
      note: UI.health.organsNote[lang],
      disclaimer: UI.health.disclaimer[lang],
      useful: { name: useEl.name[lang], zh: useEl.zh }
    };
  }

  function cycles(chart, lang) {
    const luck = chart.luck;
    const idx = luck.index;
    let currentText;
    if (idx < 0) {
      currentText = UI.cycles.before[lang];
    } else {
      const l = luck.list[idx];
      const god = godOf(S.tenGod(chart.pillars[2].stem, l.stem));
      currentText = L(
        `The decade of ${S.STEM_PY[l.stem]}-${S.BRANCH_PY[l.branch]} ${STEMS[l.stem]}${BRANCHES[l.branch]}, ages ${Math.round(l.from)}–${Math.round(l.to)}, carries the signature of ${god.name.en.toLowerCase()}. ${god.text.en}`,
        `你正行 ${STEMS[l.stem]}${BRANCHES[l.branch]} 运（${Math.round(l.from)}—${Math.round(l.to)}岁），带着“${god.name.zh}”的气息。${god.text.zh}`
      )[lang];
    }
    const toneWords = {
      friend: L('self-reliance', '自立'), rival: L('contest', '竞争'), output: L('craft', '技艺'),
      expression: L('expression', '破格'), indirectWealth: L('venture', '逐利'), directWealth: L('stewardship', '守成'),
      sevenKill: L('pressure', '压力'), directOfficer: L('order', '秩序'), indirectResource: L('solitude', '独处'),
      directResource: L('learning', '学习')
    };
    const years = chart.years.map(y => {
      const god = godOf(y.god);
      const tone = toneWords[y.god][lang];
      let note;
      if (y.clash) {
        note = L(`a year that tugs at your closest bond — move gently at home`, '此年牵动最亲的那根线，家中之事宜缓');
      } else {
        note = L(`a year of ${tone}`, `主${tone}`);
      }
      return { ...y, label: `${y.year} · ${STEMS[y.stem]}${BRANCHES[y.branch]}`, tone, note: note[lang], god: god.name[lang] };
    });
    return { currentText, years, startAge: Math.round(luck.startAge) };
  }

  function cautions(chart, lang) {
    const out = [];
    const weakEl = elOf(chart.weakest);
    const dm = dmOf(chart);
    const clashText = {
      'year-day': L('The pillar of your origins and the pillar of yourself pull in opposite directions. Home, family and the person you have become may never fully agree. The work is not to choose one — it is to stop asking either to justify the other.',
        '年柱与日柱相冲：来处与自我方向相反。家、家族与你后来成为的那个人，也许永远无法完全一致。功课不是二选一，而是不再要求任何一方为另一方辩解。'),
      'month-day': L('Career and partnership compete for the same hours. You will be asked, more than once, to choose between being needed at work and being present at home. Choose consciously rather than by default.',
        '月柱与日柱相冲：事业与伴侣争夺同一段时间。你会不止一次被要求，在工作需要你与家庭需要你之间选择。请有意识地选，而不是默认。'),
      'day-hour': L('Ambition and rest are at odds in your chart. You can build a remarkable life and still be unable to sit still inside it. Rest must be scheduled, or it will be stolen.',
        '日柱与时柱相冲：野心与休息在命里拉扯。你可能建起很好的生活，却无法在其中安坐。休息必须被安排进日程，否则就会被偷走。'),
      'year-month': L('Early environment and later path do not match. The expectations you were raised inside may keep whispering long after you have left the room.',
        '年柱与月柱相冲：早年的环境与后来的路并不吻合。你成长时所背负的期待，会在你离开那个房间很久之后仍在低语。'),
      'month-hour': L('Work and the future you imagine for yourself are not yet aligned. What pays now and what fulfils later are two different roads; you will need to walk both for a while.',
        '月柱与时柱相冲：眼下的工作与你想去的未来尚未对齐。现在养你的，和以后成全你的，是两条路，你需要并行一段。'),
      'year-hour': L('The past and the future speak different languages in your chart. You may feel homesick for a place that no longer exists.',
        '年柱与时柱相冲：过去与未来说着不同的语言。你可能会怀念一个早已不存在的地方。')
    };
    if (chart.clashes.length) {
      const c = chart.clashes[0];
      const key = [c.a, c.b].sort((a, b) => ['year', 'month', 'day', 'hour'].indexOf(a) - ['year', 'month', 'day', 'hour'].indexOf(b)).join('-');
      out.push({
        title: L('Where the ground shifts', '地基松动之处'),
        body: clashText[key] || clashText['day-hour'],
        practice: L('Name the tension out loud once a season. Unnamed pressure becomes resentment; named pressure becomes a decision.',
          '每季把这份拉扯说出口一次。没有命名的压力会变成怨，命名之后才会变成决定。')
      });
    }
    out.push({
      title: L(`The ${weakEl.name.en} you carry least`, `${weakEl.zh}气最薄之处`),
      body: L(`Your chart runs light on ${weakEl.name.en.toLowerCase()}. In the body that often shows up as ${weakEl.health.en}. In a life, it shows up as the thing you keep postponing because it does not come naturally.`,
        `你命中${weakEl.zh}气最薄。在身体上，常表现为${weakEl.health.zh}；在人生里，则表现为那件你总在推迟、因为它对你不自然的事。`),
      practice: weakEl.practice
    });

    const seven = (chart.gods.sevenKill || 0);
    const expr = (chart.gods.expression || 0);
    const rival = (chart.gods.friend || 0) + (chart.gods.rival || 0);
    if (seven >= 2.4) {
      out.push({
        title: L('The weight you were not meant to carry', '本不该你扛的重量'),
        body: L(`Pressure is a familiar room for you, and you have learned to perform inside it. But a chart this heavy on the Commander tends to confuse survival with purpose: you keep choosing the harder road because ease feels unearned.`,
          `压力是你熟悉的房间，你也学会在其中发挥。但七杀偏重的命，容易把“撑住”误当成“意义”：你总选更难的那条路，因为轻松让你觉得不配。`),
        practice: L('Before you accept the next heavy thing, wait one full day. If it is still yours to carry, carry it; if it was only urgent, let it pass.',
          '接下下一件重担之前，先等一整天。如果它仍是你的，就扛；如果它只是紧急，就让它过去。')
      });
    }
    if (expr >= 2.6) {
      out.push({
        title: L('The sharp edge of your tongue', '舌上的锋刃'),
        body: L(`You are quick, and you are usually right — which is exactly what makes the wound land. In close relationships, being correct is a poor substitute for being kind, and the people who love you are not grading your arguments.`,
          `你快，而且常常是对的——这正是伤人之处。在亲密关系里，“正确”替代不了“温和”；爱你的人，并不是在给你的论证打分。`),
        practice: L('Say the true thing, then say one more sentence that makes it safe to hear.',
          '说出真话之后，再多说一句，让对方有地方安放它。')
      });
    }
    if (rival >= 3.2) {
      out.push({
        title: L('The leaky bucket', '漏水的桶'),
        body: L(`Your resources move toward other people — some by generosity, some by competition, some by the quiet belief that you must keep proving you have enough to share.`,
          `你的资源总流向别人——有些是慷慨，有些是较劲，有些是那个安静的信念：你必须不断证明自己给得起。`),
        practice: L('Separate the account for giving from the account for living. Decide the first number once a year, and do not renegotiate it in the moment.',
          '把“给出去的钱”和“过日子的钱”分成两个账户。前者一年定一次数，不在当下重新谈判。')
      });
    }
    if (chart.dayMaster.strength === 'weak' && (chart.gods.directOfficer || 0) + (chart.gods.sevenKill || 0) >= 2.4) {
      out.push({
        title: L('A life of other people’s expectations', '活在别人的期待里'),
        body: L(`Your chart is light on self and heavy on obligation: you are fluent in what others need, and less fluent in what you want. This is not weakness — it is a talent that has been overused.`,
          `日主偏轻而官杀偏重：你对“别人需要什么”极为熟练，对“自己想要什么”却生疏。这不是软弱，而是一项被过度使用的天赋。`),
        practice: L('Once a week, answer one question honestly before asking anyone else: “What do I actually want?”',
          '每周一次，在问别人之前先诚实回答自己：“我到底想要什么？”')
      });
    }
    if (out.length < 2) {
      out.push({
        title: L('The pace you were given', '你被分到的节奏'),
        body: L(`Your chart favours a rhythm that is not the culture's default: a little slower to commit, a little harder to derail. The pressure to move at someone else's speed is not a moral failing on your part — it is simply the wrong weather for you.`,
          `你的命盘偏爱的节奏，并不是这个时代默认的速度：决定得慢一点，却更难被带偏。被迫按别人的速度生活，不是你的道德缺陷，只是那阵风不适合你。`),
        practice: L('Choose one long, unglamorous practice and keep it for a year. Let the results arrive late.',
          '选一件漫长、不起眼的事，做满一年。让结果晚一点到。')
      });
    }
    return out.slice(0, 3).map(c => ({ title: c.title[lang], body: c.body[lang], practice: c.practice[lang] }));
  }

  function summary(chart, lang) {
    const name = displayName(chart, lang);
    const dm = dmOf(chart);
    const w = wealth(chart, lang);
    const el = elOf(chart.useful);
    const branch = BRANCH_LOVE[chart.pillars[2].branch];
    const strongKey = chart.dayMaster.strength;
    const lower = str => str.charAt(0).toLowerCase() + str.slice(1);
    const cap = str => str.charAt(0).toUpperCase() + str.slice(1);

    const strengthLine = {
      strong: L(`There is a great deal of you in this chart, which is a gift until it becomes a wall.`,
        `这张盘里“你”的分量很足——这是天赋，直到它变成一堵墙。`),
      balanced: L(`The proportions are unusually even: you are neither starved of self nor overfull of it.`,
        `这张盘的比例少见地匀称：你不缺自己，也没有被自己撑满。`),
      weak: L(`Your chart is light on self and rich in relationship — you become yourself in company, and wilt in the wrong room.`,
        `你命中自我偏轻、关系偏重——你在人群中成为自己，也会在错的房间里枯萎。`)
    }[strongKey][lang];

    const weakEl = elOf(chart.weakest);
    const useEl = elOf(chart.useful);
    const organProse = lang === 'en'
      ? weakEl.organ.en.replace(/ · /g, ', ').replace(/, ([^,]*)$/, ' and $1')
      : weakEl.organ.zh.replace(/ · /g, '、');

    const healthLine = lang === 'en'
      ? `In the body, ${weakEl.name.en.toLowerCase()} runs thin — ${organProse}. ${useEl.care[0].en}`
      : `于身，${weakEl.zh}气偏薄——${organProse}。${useEl.care[0].zh}`;

    const paragraph = lang === 'en'
      ? `${name}, you are ${dm.epithet.en.toLowerCase()} — ${lower(dm.essence.en)} ${strengthLine} In love, you need ${lower(branch.need.en)} Financially, expect ${w.short}. ${healthLine}`
      : `${name}，你是${dm.epithet.zh}——${dm.essence.zh}${strengthLine}于情，你需要${branch.need.zh}于财，${w.short}${healthLine}`;

    const verdicts = {
      character: lang === 'en'
        ? `${cap(dm.epithet.en)} — ${dm.traits.slice(0, 3).map(t => t.en.toLowerCase()).join(', ')}.`
        : `${dm.epithet.zh}：${dm.traits.slice(0, 3).map(t => t.zh).join('、')}。`,
      love: lang === 'en' ? branch.need.en : branch.need.zh,
      wealth: lang === 'en' ? cap(w.short) : w.short,
      health: lang === 'en'
        ? `${weakEl.name.en} runs thin — ${organProse}. ${useEl.care[0].en}`
        : `${weakEl.zh}气偏薄——${organProse}。${useEl.care[0].zh}`
    };

    return {
      paragraph,
      verdicts,
      keep: {
        colors: el.colors,
        direction: el.direction[lang],
        numbers: el.numbers,
        element: `${el.name.en} · ${el.zh}`,
        elementKey: el.key
      },
      mantra: dm.mantra[lang],
      name
    };
  }

  global.Content = {
    L, UI, DM, ELEMENT, GOD, BRANCH_LOVE, STEMS, STEM_PY, BRANCHES, BRANCH_PY, ANIMALS,
    displayName, dmOf, elOf, godOf, formatDate, formatTime, ZODIAC,
    personality, love, wealth, health, zodiac, cycles, cautions, summary
  };
})(typeof window !== 'undefined' ? window : globalThis);
