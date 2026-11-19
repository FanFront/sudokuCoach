import { examples } from './examples.js';

export const lessonGroups = [
  { title: "唯一数", ids: ["open-singles", "hidden-single", "naked-single"] },
  { title: "区块排除", ids: ["pointing", "claiming"] },
  { title: "数对与数组", ids: ["naked-pair", "hidden-pair", "hidden-triple"] },
  { title: "鱼形", ids: ["x-wing", "swordfish"] },
  { title: "强链接与翼形", ids: ["skyscraper", "two-string-kite", "y-wing", "xyz-wing"] },
  { title: "染色", ids: ["simple-colouring", "3d-medusa"] },
  { title: "推理链", ids: ["x-chain", "xy-chain", "aic"] },
  { title: "唯一性", ids: ["unique-rectangle", "bug-plus-one"] }
];

const syllabus = [
  {
    id: 'open-singles', title: '最后一格', subtitle: '用缺少的数字补齐一组',
    rule: '每行、每列、每个九宫都要恰好用到 1 至 9。只剩一个空格时，缺少的数字就属于它。',
    observation: '找一找只剩一个空格的行、列或宫。',
    action: '选中空格，再点这一组缺少的数字。'
  },
  {
    id: 'hidden-single', title: '隐性唯一数', subtitle: '给一个数字寻找唯一位置',
    rule: '选定一个数字，逐格排除一组里不能放它的位置。当它只剩一个去处，就可以填入。',
    observation: '盯住一个数字，数一数它在这组还有几个位置。',
    action: '在唯一能容纳目标数字的空格填数。'
  },
  {
    id: 'naked-single', title: '显性唯一数', subtitle: '读出空格的最后一个候选',
    rule: '把同行、同列、同宫已有的数字从候选中划去。一个格子只剩一个候选时，它的值已经确定。',
    observation: '检查哪些空格的候选表只剩一个数字。',
    action: '选中这个空格，填入它仅剩的候选。'
  },
  {
    id: 'pointing', title: '宫内区块排除', subtitle: '沿着宫与行列的交线删数',
    rule: '如果一个数字在某宫的所有候选都位于同一行或同一列，它必定由这段交线上的一格取得。沿线走到宫外，其他格都可以删去这个数字。',
    observation: '查看一个宫，找出某个数字的所有候选是否排成一线。',
    action: '沿这条线走出宫，删去宫外格子里相同的候选数。'
  },
  {
    id: 'naked-pair', title: '显性数对', subtitle: '用两格锁定两个数字',
    rule: '同一组里，两格恰好拥有相同的两个候选。无论两数如何交换，它们都会占满这两格，因此可以从本组其余格删除这两个候选。',
    observation: '在同一行、列或宫里，寻找候选完全相同的两个双值格。',
    action: '保留数对两格的候选，从同组的其他格中删除被占用的数。'
  },
  {
    id: 'claiming', title: '行列区块排除', subtitle: '沿行或列锁定一个宫',
    rule: '若一行或一列的某数字只能落在同一个宫里，该宫必须把这个数字留给交叠的那一段。',
    observation: '选一行或一列，找出只在一个宫里出现的候选数。',
    action: '从该宫的其他行或列里删掉这个候选。'
  },
  {
    id: 'hidden-pair', title: '隐性数对', subtitle: '从两格中剔除多余候选',
    rule: '同一行、列或宫里，两个数字如果只出现在相同的两格，那么这两格必须分别填入这两个数。',
    observation: '数一数每个数字在同一组里可以放在哪些格。',
    action: '在锁定的两格里，只留下数对使用的两个候选。'
  },
  {
    id: 'hidden-triple', title: '隐性三数组', subtitle: '三个数字锁定三格',
    rule: '同一个单元中，三个数字的所有候选位置合起来只有三格，这三格必须留给这三个数。',
    observation: '挑三个数字，看它们在同一行、列或宫的位置是否总共只有三格。',
    action: '从这三格中删去其余候选。'
  },
  {
    id: 'x-wing', title: 'X 翼', subtitle: '用两条平行线锁定两条交叉线',
    rule: '若某个数在两行里都只可能位于相同的两列，每行各占一列，两列都被锁定。也可以交换行和列。',
    observation: '找同一个候选在两条平行线上排成矩形四角的情形。',
    action: '从两条交叉线上其余格删掉该候选。'
  },
  {
    id: 'swordfish', title: '剑鱼', subtitle: '把 X 翼扩展到三条线',
    rule: '如果某个数在选定的三行中只出现在三列里，每行各填一次，三列就各被占用一次。行列可以互换。',
    observation: '找三条平行线，合并它们的同一数字的位置，检查是否正好落在三条交叉线上。',
    action: '从三条交叉线上、这三条平行线之外的格子删去该候选。'
  },
  {
    id: 'skyscraper', title: '摩天楼', subtitle: '两个顶端至少有一处为真',
    rule: '两条平行线各只剩同一个数的两个位置，且两组各有一个位置排在同一条交叉线上。这两个底端不能同时为真，因此两个顶端至少有一个为真。',
    observation: '找两条平行线上的同数强链接，检查是否有一对端点对齐。',
    action: '删掉同时看得见两个顶端的格子里的该候选。'
  },
  {
    id: 'two-string-kite', title: '双线风筝', subtitle: '在同一宫连接一行和一列',
    rule: '一行和一列各有一对同数候选，且各有一个端点落在同一宫的不同格子里。宫内端点不能同时为真，所以两个外侧端点至少有一个为真。',
    observation: '找一行和一列的同数强链接，看是否可以在一个宫里连接。',
    action: '删掉同时看得见两个外侧端点的格子里的该候选。'
  },
  {
    id: 'y-wing', title: 'Y 翼', subtitle: '由一个双值枢纽连接两个翼格',
    rule: '枢纽格只有 A、B 两个候选，且看得见候选为 A/C 和 B/C 的两个翼格。枢纽无论填 A 还是 B，总有一个翼格填 C。',
    observation: '找一个双值枢纽，以及各共享一个枢纽候选、又共享第三个候选的两个翼格。',
    action: '从同时看得见两个翼格的其他格中删去第三个候选。'
  },
  {
    id: 'simple-colouring',
    title: '简单染色',
    subtitle: '给同一个数字交替着色',
    rule: '一行、列或宫只剩某个数字的两个位置时，其中恰有一个为真。沿这些强链接交替染成蓝色和紫色，同一连通组里一色全真、另一色全假。',
    observation: '沿棋盘上的实线检查每一对异色候选。',
    action: '若同色的两个候选互斥，删掉这种颜色。若一个组外候选同时被两色排斥，删掉它。'
  },
  {
    id: '3d-medusa',
    title: '立体染色',
    subtitle: '用双值格把不同数字连起来',
    rule: '一个双值格的两个候选恰好有一个为真，也能作为强链接。把格内强链接和行、列、宫内的同数强链接一起染色。',
    observation: '实线可跨格连接相同数字，也可在同格连接不同数字。',
    action: '检查同色候选是否互斥，以及未染色候选是否在两种颜色为真的情况下都被排除。'
  },
  {
    id: 'x-chain',
    title: '单数链（X-Chain）',
    subtitle: '用一个数字串起交替推理',
    rule: '同一个数字沿强、弱链接交替连接，并以强链接开头和结尾。如果链的一端为假，另一端一定为真。',
    observation: '沿实线和虚线找出共享同一个数字的两个端点。',
    action: '删掉任何同时和两个端点互斥的同数候选。'
  },
  {
    id: 'xy-chain',
    title: '双值链（XY-Chain）',
    subtitle: '从一个双值格传到下一个',
    rule: '双值格内的两个候选用强链接相连，相邻链格的共同候选用弱链接相连。当两端对应同一个数字，至少一端为真。',
    observation: '从端点开始，交替经过格内实线和格间虚线。',
    action: '删掉能够同时看见两个端点的同数候选。'
  },
  {
    id: 'aic',
    title: '交替推理链（AIC）',
    subtitle: '在多个数字之间传递真假',
    rule: '强链接保证至少一端为真，弱链接保证至多一端为真。沿强弱交替的链，从一端为假推出另一端为真。',
    observation: '找到以实线起止的链，检查两个端点的候选。',
    action: '跨格同数端点能排除同时看见两端的候选。同格异数端点能排除该格的其他候选。'
  },
  {
    id: 'xyz-wing',
    title: 'XYZ 翼',
    subtitle: '三值枢纽与两个双值翼格',
    rule: '枢纽的候选为 X、Y、Z，两个能看见枢纽的翼格分别有 X/Z 和 Y/Z。枢纽填 Z，或者迫使某一个翼格填 Z。',
    observation: '找同时出现在三格里的候选 Z，确认两翼都看得见枢纽。',
    action: '从同时看见枢纽和两个翼格的空格中删掉候选 Z。'
  },
  {
    id: 'unique-rectangle',
    title: '唯一矩形（类型 1）',
    subtitle: '双解假设迫使第四角用额外数字',
    rule: '在已确认唯一解的题中，若跨两个宫的矩形有三角只含同一数对，第四角必须避开该数对，否则交换四角的这两个数仍可成立。',
    observation: '检查四角是否恰好跨两个宫，并找出带额外候选的一角。',
    action: '从带额外候选的角删掉这两个候选。'
  },
  {
    id: 'bug-plus-one',
    title: 'BUG+1',
    subtitle: '找出打破双值结构的数字',
    rule: '在已确认唯一解的题中，若只剩一个三值格，且去掉一个候选后所有未填单元的各候选都恰好出现两次，剩余的双值结构会允许把候选整体对换。',
    observation: '找唯一的三值格，核对额外候选在它的行、列、宫内各出现三次。',
    action: '把破坏双值对称的额外候选填入三值格。'
  }
];

export const lessons = syllabus.map(lesson => ({ practiceCount: 4, ...lesson, examples: examples[lesson.id] }));
