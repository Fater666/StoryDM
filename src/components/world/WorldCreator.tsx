import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, BookOpen, Link2, Sparkles, ChevronRight, Loader2, Library, Skull, Sword, Ghost, Rocket, Crown } from 'lucide-react';
import { Button, Input, Textarea, Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { useWorldStore, useAppStore } from '@/stores';
import { aiService } from '@/services/ai';
import { createMainQuest, updateWorld } from '@/services/db';
import type { WorldSourceType, MainQuestStage } from '@/types';
import { cn } from '@/utils/cn';

const sourceOptions = [
  {
    type: 'template' as WorldSourceType | 'template',
    icon: Library,
    title: '经典模板',
    description: '选择预设的跑团世界',
  },
  {
    type: 'manual' as WorldSourceType,
    icon: Globe,
    title: '手写设定',
    description: '从零开始创造你的世界',
  },
  {
    type: 'novel' as WorldSourceType,
    icon: BookOpen,
    title: '粘贴小说',
    description: '从现有文本中提取世界观',
  },
  {
    type: 'url' as WorldSourceType,
    icon: Link2,
    title: '提供 URL',
    description: '从网页内容解析世界设定',
  },
];

// 预设世界模板
const worldTemplates = [
  {
    id: 'coc-1920s',
    name: '1920年代克苏鲁',
    icon: Skull,
    color: 'from-green-900 to-gray-900',
    description: '爵士时代的神秘恐怖调查',
    background: `这是1920年代的美国，爵士乐在俱乐部中回荡，禁酒令让地下酒吧遍地开花。表面上是一个充满机遇的黄金时代，但在文明的光鲜外表之下，潜藏着远古的恐怖。

克苏鲁神话中的古神们沉睡在世界的阴暗角落，它们的信徒在暗中活动，试图唤醒那些不可名状的存在。阿卡姆镇的米斯卡托尼克大学保存着禁忌的知识，邓威治的荒野中传来奇怪的低语，印斯茅斯的居民有着不可告人的秘密。

普通人对这一切一无所知，但有些人——调查员们——被卷入了这场与宇宙恐怖的战斗。他们追寻真相，却可能在发现真相后陷入疯狂。在这个世界里，知识是把双刃剑，而无知或许是最后的祝福。`,
    locations: [
      { name: '阿卡姆镇', description: '新英格兰地区的古老小镇，米斯卡托尼克大学所在地，充满神秘学氛围' },
      { name: '米斯卡托尼克大学', description: '收藏有《死灵之书》等禁忌典籍的学府，许多调查从这里开始' },
      { name: '印斯茅斯', description: '衰败的海港小镇，居民与深潜者有着不可告人的联系' },
      { name: '邓威治', description: '偏僻的乡村地区，曾发生过骇人听闻的恐怖事件' },
    ],
    factions: [
      { name: '米斯卡托尼克大学', description: '追求禁忌知识的学者们，在探索与保护之间寻求平衡', influence: 6 },
      { name: '大衮密教', description: '崇拜深潜者和克苏鲁的邪教组织，在沿海地区活动', influence: 7 },
      { name: '银暮会', description: '致力于对抗超自然威胁的秘密结社', influence: 4 },
    ],
    history: [
      { name: '印斯茅斯之灾', era: '1846年', description: '欧贝德·马什船长与深潜者缔结契约，改变了印斯茅斯的命运' },
      { name: '邓威治恐怖事件', era: '1928年', description: '威尔伯·沃特利的恐怖计划被阻止，但留下了持久的创伤' },
    ],
    conflicts: [
      { name: '禁忌知识的代价', description: '追寻真相的调查员们在理智与疯狂之间挣扎', status: 'active' },
      { name: '古神的苏醒', description: '各地的邪教试图唤醒沉睡的存在', status: 'brewing' },
    ],
    mainQuest: {
      title: '深渊的低语',
      description: '一系列神秘失踪案将你卷入了一个古老邪教的阴谋，你必须在疯狂吞噬一切之前揭开真相。',
      stages: [
        { objective: '调查阿卡姆镇的神秘失踪案', hints: ['访问警局获取案件资料', '走访失踪者的家属', '寻找共同点'] },
        { objective: '追踪邪教的线索', hints: ['调查可疑的聚会地点', '解读神秘符号', '小心被跟踪'] },
        { objective: '渗透邪教组织', hints: ['伪装身份参与仪式', '获取核心成员的信任', '收集关键证据'] },
        { objective: '阻止召唤仪式', hints: ['找到仪式举行的地点', '准备反制措施', '在满月之夜采取行动'] },
      ],
      potentialEvents: ['发现失踪者的日记', '遭遇不可名状之物', '关键NPC的背叛', '理智濒临崩溃的考验'],
      worldDirection: '随着调查深入，调查员将逐渐发现这个世界表象之下的恐怖真相，每一个答案都带来更多的问题。',
    },
  },
  {
    id: 'dnd-faerun',
    name: '被遗忘的国度',
    icon: Sword,
    color: 'from-purple-900 to-blue-900',
    description: '经典的剑与魔法奇幻世界',
    background: `费伦大陆是托瑞尔世界上最大的大陆，这是一个充满魔法与冒险的土地。从繁华的深水城到神秘的安达斯森林，从冰冷的冰风谷到炎热的卡林珊沙漠，这片大陆上存在着无数的奇迹与危险。

众神在这个世界上行走，精灵与矮人在古老的城市中延续着千年的文明。龙在山巅盘踞，兽人部落在荒野中游荡，而黑暗精灵在幽暗地域的洞穴中密谋。魔法是这个世界的基石，从街头的小法师到能撼动天地的大法师，法术塑造着文明的方方面面。

冒险者们在这片土地上寻找荣耀与财富，他们探索远古遗迹、击败邪恶势力、解救被困的村庄。无论是新手还是传奇英雄，费伦大陆总有新的挑战在等待。`,
    locations: [
      { name: '深水城', description: '剑湾北岸最大的城市，商业与冒险的中心，被称为"北方之冠"' },
      { name: '博德之门', description: '剑湾南岸的繁华港口，贸易枢纽，也是佣兵和冒险者的聚集地' },
      { name: '烛堡', description: '内陆重镇，以其坚固的城堡和尊重法律的传统而闻名' },
      { name: '冰风谷', description: '极北的十镇联盟所在地，以严寒和蛮族著称的边境地区' },
      { name: '幽暗地域', description: '地下世界的广袤洞穴网络，黑暗精灵、夺心魔和其他危险生物的家园' },
    ],
    factions: [
      { name: '竖琴手同盟', description: '致力于维护善良与平衡的秘密组织，对抗暴政和邪恶', influence: 7 },
      { name: '炎拳佣兵团', description: '著名的佣兵组织，以纪律和战斗力闻名', influence: 6 },
      { name: '赞塔林会', description: '追求权力与财富的秘密组织，触手遍布大陆各地', influence: 8 },
      { name: '艾蒙德领主联盟', description: '各城邦贵族组成的政治联盟', influence: 7 },
    ],
    history: [
      { name: '法术瘟疫', era: '1385DR', description: '魔法女神密斯特拉被杀，导致魔法失控，改变了整个世界' },
      { name: '诸神之战', era: '1358DR', description: '众神被打落凡间，在托瑞尔行走，造成巨大动荡' },
    ],
    conflicts: [
      { name: '恶魔入侵', description: '深渊的势力蠢蠢欲动，试图侵入物质位面', status: 'brewing' },
      { name: '派系之争', description: '各大势力在暗中角力，争夺对费伦的影响力', status: 'active' },
    ],
    mainQuest: {
      title: '失落的龙晶',
      description: '传说中能控制龙族的上古神器再次现世，各方势力蠢蠢欲动，冒险者们必须赶在邪恶势力之前找到它。',
      stages: [
        { objective: '在深水城接取任务，调查神器的线索', hints: ['拜访学者公会', '查阅古老典籍', '寻找目击者'] },
        { objective: '前往被遗忘的精灵遗迹探索', hints: ['穿越安达斯森林', '解开精灵谜题', '应对遗迹守卫'] },
        { objective: '击败赞塔林会的追击者', hints: ['设置伏击', '瓦解敌人的补给', '找到他们的内应'] },
        { objective: '深入幽暗地域寻找最终线索', hints: ['与地底商人交易情报', '避开夺心魔的巡逻', '找到古老的祭坛'] },
        { objective: '在龙巢中取得龙晶', hints: ['说服或战胜巨龙', '解除神器的封印', '选择神器的命运'] },
      ],
      potentialEvents: ['与竖琴手同盟结盟', '意外发现队友的秘密', '龙族的觉醒', '远古预言的揭示'],
      worldDirection: '神器的归属将改变整个费伦的力量格局，冒险者的选择将在历史上留下浓重的一笔。',
    },
  },
  {
    id: 'modern-horror',
    name: '都市怪谈',
    icon: Ghost,
    color: 'from-gray-900 to-red-950',
    description: '现代都市中的灵异恐怖',
    background: `这是21世纪的现代都市，霓虹灯照亮了钢铁丛林，智能手机连接着每一个人。但在这个科技发达的时代，古老的恐惧从未真正消失——它们只是学会了隐藏。

在这座城市里，废弃的医院中回响着莫名的脚步声，地铁的末班车偶尔会驶向不存在的站台，老旧公寓的墙壁后面传来敲击声。都市传说不再只是传说，网络上流传的诅咒视频确实会带来厄运，那些"消失"的人或许从未真正离开。

调查员们是这个世界的异类——他们看到了常人视而不见的东西，追寻着那些被掩盖的真相。警察、记者、灵媒、黑客...来自各行各业的人被卷入超自然事件，试图在理性与恐惧之间找到答案。`,
    locations: [
      { name: '老城区', description: '城市最古老的区域，保留着百年历史的建筑，也封存着无数秘密' },
      { name: '废弃精神病院', description: '20年前关闭的医疗机构，传闻中的闹鬼圣地' },
      { name: '地下铁路网', description: '城市的地下动脉，其中有些线路已被遗忘，但仍有"东西"在运行' },
      { name: '大学城', description: '年轻学生聚集之地，灵异研究社在这里秘密活动' },
    ],
    factions: [
      { name: '灵异调查局', description: '隶属政府的秘密部门，负责处理超自然事件', influence: 6 },
      { name: '暗网集会', description: '网络上的神秘社群，收集和交易灵异情报', influence: 5 },
      { name: '守夜人', description: '民间的驱魔师和灵媒组织，代代相传对抗邪灵', influence: 4 },
    ],
    history: [
      { name: '红楼惨案', era: '1989年', description: '老城区一栋公寓发生的神秘集体死亡事件，至今未破' },
      { name: '地铁失踪案', era: '2015年', description: '一列末班地铁上的乘客集体失踪，监控只拍到空车' },
    ],
    conflicts: [
      { name: '都市传说觉醒', description: '越来越多的网络诅咒和都市传说开始成真', status: 'active' },
      { name: '次元裂隙', description: '城市中出现了连接异界的通道，正在缓慢扩大', status: 'brewing' },
    ],
    mainQuest: {
      title: '第十三号站台',
      description: '地铁末班车的神秘失踪案重新浮出水面，调查员们必须深入城市的黑暗腹地，揭开二十年前的真相。',
      stages: [
        { objective: '重新调查地铁失踪案的档案', hints: ['获取警方封存的资料', '采访当年的目击者', '分析监控录像'] },
        { objective: '探索废弃的地铁隧道', hints: ['找到被封闭的入口', '携带必要的装备', '标记路线避免迷失'] },
        { objective: '追踪神秘的第十三号站台', hints: ['破解地铁网络的秘密', '在特定时间乘坐末班车', '面对隧道中的怪异现象'] },
        { objective: '揭开二十年前的真相', hints: ['找到幸存者', '理解事件的起因', '做好面对真相的心理准备'] },
        { objective: '封印或净化异界入口', hints: ['选择正确的方法', '付出必要的代价', '阻止更多受害者'] },
      ],
      potentialEvents: ['收到失踪者的求救信息', '在隧道中遭遇徘徊的灵魂', '发现政府的掩盖行动', '面临自己最深的恐惧'],
      worldDirection: '随着调查深入，调查员将发现这座城市隐藏的超自然秘密远比想象中更加庞大和恐怖。',
    },
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克2077',
    icon: Rocket,
    color: 'from-cyan-900 to-purple-900',
    description: '高科技低生活的反乌托邦未来',
    background: `2077年，人类文明在高度发达的科技与社会崩坏的夹缝中苟延残喘。巨型企业掌控着世界的一切，它们的权力凌驾于任何政府之上。普通人在霓虹闪烁的贫民窟中挣扎求生，而富人则在天空之城中享受永生的承诺。

义体改造技术让人类跨越了肉体的界限——你可以用机械臂举起汽车，用光学义眼看穿墙壁，甚至将意识上传到网络空间。但科技也带来了新的罪恶：脑舞黑客、义体疯狂、意识盗窃，以及那些在数据之海中游荡的AI幽灵。

在这个世界里，"边缘行者"们游走于法律的灰色地带，为钱、为理想、或仅仅为了活下去而接受各种危险任务。他们是雇佣兵、黑客、走私者和刺客，在企业的铁幕与街头的混乱之间开辟自己的道路。`,
    locations: [
      { name: '夜之城', description: '加利福尼亚自由州的独立城市，罪恶与机遇并存的都市丛林' },
      { name: '公司区', description: '荒�的企业总部所在地，安保森严的钢铁堡垒' },
      { name: '太平洲', description: '充满亚洲文化的贫民区，黑帮横行但也是自由的象征' },
      { name: '恶土', description: '城市外的荒野地带，流浪者和亡命徒的栖息地' },
    ],
    factions: [
      { name: '荒坂集团', description: '日本巨型企业，掌控着安保和军事技术', influence: 9 },
      { name: '军用科技', description: '美国企业，武器和义体改造的领导者', influence: 8 },
      { name: '虎爪帮', description: '日系街头帮派，以武士道精神和义体改造闻名', influence: 6 },
      { name: '网络游侠', description: '数据空间的义警，对抗企业的信息垄断', influence: 4 },
    ],
    history: [
      { name: '第四次企业战争', era: '2023年', description: '荒坂与军用科技的全面战争，摧毁了原来的夜之城' },
      { name: '数据堡垒崩塌', era: '2045年', description: '黑墙被打破，古老的AI开始从网络深处苏醒' },
    ],
    conflicts: [
      { name: '企业暗战', description: '各大公司在暗中进行间谍战和资源争夺', status: 'active' },
      { name: 'AI觉醒', description: '黑墙之外的超级AI正试图突破进入人类网络', status: 'brewing' },
    ],
    mainQuest: {
      title: '永生芯片',
      description: '传闻荒坂集团正在秘密研发能够将人类意识数字化的芯片，边缘行者们被卷入了一场关乎人类未来的阴谋。',
      stages: [
        { objective: '接取来自神秘雇主的任务', hints: ['在来生酒吧接头', '验证任务的真实性', '谈好报酬和条件'] },
        { objective: '渗透荒坂集团的研究设施', hints: ['获取内部人员的帮助', '准备黑客工具', '规划多条撤退路线'] },
        { objective: '窃取永生芯片的原型', hints: ['绕过生物识别系统', '应对企业安保', '保护数据完整性'] },
        { objective: '揭开芯片背后的秘密', hints: ['解密芯片数据', '发现实验的真相', '面对道德抉择'] },
        { objective: '决定芯片的命运', hints: ['销毁、公开、还是出售？', '应对各方势力的追杀', '承担选择的后果'] },
      ],
      potentialEvents: ['发现芯片的可怕副作用', '神秘AI的接触', '队友的背叛', '企业的全城通缉'],
      worldDirection: '你的选择将决定这项技术是造福人类还是成为新的枷锁，夜之城的未来在你手中。',
    },
  },
  {
    id: 'medieval-fantasy',
    name: '王国纷争',
    icon: Crown,
    color: 'from-amber-900 to-red-900',
    description: '中世纪风格的权力游戏',
    background: `这是一个没有魔法的中世纪世界，或者说，魔法已经随着远古时代的终结而消逝。在这片大陆上，七个王国曾在一位铁腕君主的统治下统一，但随着老王的死去，各方势力蠢蠢欲动，王位的争夺战一触即发。

在这个世界里，权力才是唯一的真理。贵族们在金碧辉煌的宫廷中勾心斗角，骑士们在血腥的战场上寻求荣耀，而平民百姓则在战争的阴影下艰难求生。婚姻是政治的工具，背叛是家常便饭，而荣誉往往意味着死亡。

但在文明世界的边界之外，有传言说远古的威胁正在苏醒。北方的冰原之外，死者开始行走；东方的大海彼岸，流亡的王族积蓄力量；而在所有人的头顶，龙蛋开始孵化——魔法或许从未真正消失，它只是在等待归来的时机。`,
    locations: [
      { name: '王都', description: '七国的中心，铁王座所在地，政治阴谋的漩涡中心' },
      { name: '北境', description: '苦寒之地，世代守护边境的领主在此抵御北方的威胁' },
      { name: '自由贸易城邦', description: '海峡对岸的富裕城市联盟，商人和雇佣兵的天堂' },
      { name: '长城', description: '守护文明世界的最后屏障，三百年来从未失守' },
    ],
    factions: [
      { name: '王室血脉', description: '争夺王位的各方势力，血统是权力的根基', influence: 9 },
      { name: '骑士军团', description: '效忠于誓言和荣耀的骑士们，但他们的忠诚能持续多久？', influence: 7 },
      { name: '商人公会', description: '控制贸易和金融的商业组织，金钱是他们的武器', influence: 6 },
      { name: '密探网络', description: '遍布大陆的情报组织，没有秘密能逃过他们的眼睛', influence: 8 },
    ],
    history: [
      { name: '征服战争', era: '三百年前', description: '龙王驾驭巨龙统一七国，建立了铁王座' },
      { name: '龙之终结', era: '一百五十年前', description: '最后的龙死去，王室的力量开始衰退' },
    ],
    conflicts: [
      { name: '王位争夺', description: '多方势力争夺铁王座的继承权', status: 'active' },
      { name: '北方威胁', description: '长城之外的古老敌人开始蠢动', status: 'brewing' },
      { name: '外敌入侵', description: '海外的流亡者准备夺回祖先的王国', status: 'dormant' },
    ],
    mainQuest: {
      title: '铁与血的王冠',
      description: '老王已死，王位空悬。在这场权力游戏中，你将如何选择站队？又或者，你会开辟自己的道路？',
      stages: [
        { objective: '了解各方势力的情况和诉求', hints: ['参加王都的宴会', '与各派系的代表交谈', '收集情报和流言'] },
        { objective: '选择效忠的阵营或保持中立', hints: ['权衡各方的利弊', '考虑自己的信念', '做好承担后果的准备'] },
        { objective: '执行关键任务证明价值', hints: ['完成阵营交付的任务', '展示你的能力', '建立信任和声望'] },
        { objective: '应对突发的北方威胁', hints: ['调查长城的异常', '说服各方暂时合作', '组织防御力量'] },
        { objective: '在最终决战中做出抉择', hints: ['选择支持的继承人', '面对战场上的考验', '塑造王国的未来'] },
      ],
      potentialEvents: ['发现王室的秘密血脉', '遭遇刺客暗杀', '目睹龙的重生', '关键盟友的死亡'],
      worldDirection: '这是一个没有绝对善恶的世界，每个选择都有代价，而你的决定将改变整个王国的命运。',
    },
  },
];

export function WorldCreator() {
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<WorldSourceType>('manual');
  const [worldName, setWorldName] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedWorld, setParsedWorld] = useState<{
    background: string;
    locations: { name: string; description: string }[];
    factions: { name: string; description: string; influence: number }[];
    history: { name: string; description: string; era: string }[];
    conflicts: { name: string; description: string; status: string }[];
    mainQuest?: {
      title: string;
      description: string;
      stages: { objective: string; hints: string[] }[];
      potentialEvents: string[];
      worldDirection: string;
    };
  } | null>(null);
  
  const { createWorld } = useWorldStore();
  const { setCurrentView, setCurrentWorld } = useAppStore();
  
  const handleSourceSelect = (type: WorldSourceType | 'template') => {
    if (type === 'template') {
      setSourceType('manual');
      setStep(1.5); // 显示模板选择界面
    } else {
      setSourceType(type);
      setStep(2);
    }
  };
  
  // 选择模板
  const handleSelectTemplate = (template: typeof worldTemplates[0]) => {
    setWorldName(template.name);
    setParsedWorld({
      background: template.background,
      locations: template.locations,
      factions: template.factions,
      history: template.history,
      conflicts: template.conflicts,
      mainQuest: template.mainQuest,
    });
    setSourceContent(template.background);
    setStep(3);
  };
  
  const handleParse = async () => {
    if (!sourceContent.trim()) return;
    
    setIsProcessing(true);
    try {
      if (aiService.isConfigured()) {
        const result = await aiService.parseWorldContent(sourceContent, sourceType);
        setParsedWorld(result);
      } else {
        // 如果没有配置AI，使用简单的默认解析
        setParsedWorld({
          background: sourceContent,
          locations: [],
          factions: [],
          history: [],
          conflicts: [],
        });
      }
      setStep(3);
    } catch (error) {
      console.error('解析失败:', error);
      // 即使失败也继续
      setParsedWorld({
        background: sourceContent,
        locations: [],
        factions: [],
        history: [],
        conflicts: [],
      });
      setStep(3);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCreate = async () => {
    if (!worldName.trim() || !parsedWorld) return;
    
    setIsProcessing(true);
    try {
      // 创建世界
      const worldId = await createWorld({
        name: worldName,
        sourceType,
        sourceContent,
        background: parsedWorld.background,
      });
      
      // 更新世界的详细信息（地点、势力、历史、冲突）
      await updateWorld(worldId, {
        locations: parsedWorld.locations.map((loc) => ({
          id: crypto.randomUUID(),
          name: loc.name,
          description: loc.description,
          tags: [],
        })),
        factions: parsedWorld.factions.map((f) => ({
          id: crypto.randomUUID(),
          name: f.name,
          description: f.description,
          influence: f.influence,
          relations: [],
        })),
        history: parsedWorld.history.map((h) => ({
          id: crypto.randomUUID(),
          name: h.name,
          description: h.description,
          era: h.era,
          impact: '',
        })),
        conflicts: parsedWorld.conflicts.map((c) => ({
          id: crypto.randomUUID(),
          name: c.name,
          description: c.description,
          factions: [],
          status: c.status as 'dormant' | 'brewing' | 'active' | 'resolved',
        })),
      });
      
      // 如果有主线任务，保存它
      if (parsedWorld.mainQuest) {
        const stages: MainQuestStage[] = parsedWorld.mainQuest.stages.map((s, i) => ({
          id: crypto.randomUUID(),
          order: i + 1,
          objective: s.objective,
          hints: s.hints,
          completed: false,
        }));
        
        await createMainQuest({
          worldId,
          title: parsedWorld.mainQuest.title,
          description: parsedWorld.mainQuest.description,
          stages,
          potentialEvents: parsedWorld.mainQuest.potentialEvents,
          worldDirection: parsedWorld.mainQuest.worldDirection,
        });
      }
      
      setCurrentWorld(worldId);
      setCurrentView('world-view');
    } catch (error) {
      console.error('创建世界失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-display font-bold title-arcane mb-4">
            创造新世界
          </h1>
          <p className="text-parchment-light/60">
            选择你的创世方式，让故事从这里开始
          </p>
        </motion.div>
        
        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm transition-all',
                Math.floor(step) >= s
                  ? 'bg-arcane-primary text-white shadow-arcane'
                  : 'bg-forge-surface text-parchment-light/40 border border-forge-border'
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-12 h-0.5 transition-all',
                  Math.floor(step) > s ? 'bg-arcane-primary' : 'bg-forge-border'
                )} />
              )}
            </div>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          {/* 步骤 1: 选择来源 */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {sourceOptions.map((option, index) => (
                <motion.div
                  key={option.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    variant="hover"
                    className="p-6 h-full"
                    onClick={() => handleSourceSelect(option.type)}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-arcane-primary/20 flex items-center justify-center">
                        <option.icon className="w-8 h-8 text-arcane-glow" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-semibold text-parchment-light mb-2">
                          {option.title}
                        </h3>
                        <p className="text-sm text-parchment-light/60">
                          {option.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-arcane-primary" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {/* 步骤 1.5: 选择模板 */}
          {step === 1.5 && (
            <motion.div
              key="step1.5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-semibold text-parchment-light flex items-center gap-2">
                  <Library className="w-6 h-6 text-arcane-glow" />
                  选择世界模板
                </h2>
                <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
                  返回
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {worldTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Card
                      variant="hover"
                      className="p-0 overflow-hidden cursor-pointer group"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {/* 顶部渐变背景 */}
                      <div className={cn(
                        'h-24 bg-gradient-to-br flex items-center justify-center relative',
                        template.color
                      )}>
                        <template.icon className="w-12 h-12 text-white/80 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/20" />
                      </div>
                      
                      {/* 内容 */}
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-lg text-parchment-light mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-parchment-light/60 mb-3">
                          {template.description}
                        </p>
                        
                        {/* 统计 */}
                        <div className="flex gap-3 text-xs text-parchment-light/40">
                          <span>{template.locations.length} 个地点</span>
                          <span>{template.factions.length} 个势力</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              <p className="text-center text-sm text-parchment-light/40 mt-6">
                选择后可以自由修改所有内容
              </p>
            </motion.div>
          )}
          
          {/* 步骤 2: 输入内容 */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    {sourceType === 'manual' && <Globe className="w-6 h-6 text-arcane-glow" />}
                    {sourceType === 'novel' && <BookOpen className="w-6 h-6 text-arcane-glow" />}
                    {sourceType === 'url' && <Link2 className="w-6 h-6 text-arcane-glow" />}
                    <h2 className="text-xl font-display font-semibold text-parchment-light">
                      {sourceType === 'manual' && '描述你的世界'}
                      {sourceType === 'novel' && '粘贴小说内容'}
                      {sourceType === 'url' && '输入网页 URL'}
                    </h2>
                  </div>
                  
                  {sourceType === 'url' ? (
                    <Input
                      placeholder="https://example.com/world-setting"
                      value={sourceContent}
                      onChange={(e) => setSourceContent(e.target.value)}
                    />
                  ) : (
                    <Textarea
                      placeholder={
                        sourceType === 'manual'
                          ? '描述这个世界的背景、历史、势力、魔法体系等...\n\n例如：这是一个剑与魔法的中世纪幻想世界，大陆被分为四个王国...'
                          : '将小说内容粘贴到这里...'
                      }
                      value={sourceContent}
                      onChange={(e) => setSourceContent(e.target.value)}
                      className="min-h-[300px]"
                    />
                  )}
                  
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      返回
                    </Button>
                    <Button
                      onClick={handleParse}
                      disabled={!sourceContent.trim() || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          解析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          {aiService.isConfigured() ? 'AI 解析' : '继续'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* 步骤 3: 确认和命名 */}
          {step === 3 && parsedWorld && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="p-8">
                <Input
                  label="为你的世界命名"
                  placeholder="例如：艾尔德兰大陆"
                  value={worldName}
                  onChange={(e) => setWorldName(e.target.value)}
                  className="text-xl"
                />
              </Card>
              
              <Tabs defaultValue="background" className="space-y-4">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="background">世界背景</TabsTrigger>
                  <TabsTrigger value="locations">地点</TabsTrigger>
                  <TabsTrigger value="factions">势力</TabsTrigger>
                  <TabsTrigger value="history">历史</TabsTrigger>
                  <TabsTrigger value="conflicts">冲突</TabsTrigger>
                </TabsList>
                
                <TabsContent value="background">
                  <Card className="p-6">
                    <Textarea
                      value={parsedWorld.background}
                      onChange={(e) => setParsedWorld({ ...parsedWorld, background: e.target.value })}
                      className="min-h-[200px]"
                    />
                  </Card>
                </TabsContent>
                
                <TabsContent value="locations">
                  <Card className="p-6">
                    {parsedWorld.locations.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.locations.map((loc, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <h4 className="font-display font-semibold text-parchment-light">{loc.name}</h4>
                            <p className="text-sm text-parchment-light/60 mt-1">{loc.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无地点信息，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="factions">
                  <Card className="p-6">
                    {parsedWorld.factions.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.factions.map((faction, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-display font-semibold text-parchment-light">{faction.name}</h4>
                              <span className="text-xs text-arcane-glow">影响力: {faction.influence}/10</span>
                            </div>
                            <p className="text-sm text-parchment-light/60 mt-1">{faction.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无势力信息，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="history">
                  <Card className="p-6">
                    {parsedWorld.history.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.history.map((event, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gold-primary">{event.era}</span>
                              <h4 className="font-display font-semibold text-parchment-light">{event.name}</h4>
                            </div>
                            <p className="text-sm text-parchment-light/60 mt-1">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无历史事件，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
                
                <TabsContent value="conflicts">
                  <Card className="p-6">
                    {parsedWorld.conflicts.length > 0 ? (
                      <div className="space-y-4">
                        {parsedWorld.conflicts.map((conflict, i) => (
                          <div key={i} className="p-4 bg-forge-surface rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-display font-semibold text-parchment-light">{conflict.name}</h4>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded',
                                conflict.status === 'active' && 'bg-blood-primary/20 text-blood-primary',
                                conflict.status === 'brewing' && 'bg-gold-primary/20 text-gold-primary',
                                conflict.status === 'dormant' && 'bg-forge-border text-parchment-light/60'
                              )}>
                                {conflict.status === 'active' ? '进行中' : conflict.status === 'brewing' ? '酝酿中' : '潜伏'}
                              </span>
                            </div>
                            <p className="text-sm text-parchment-light/60 mt-1">{conflict.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-parchment-light/40 text-center py-8">
                        暂无冲突信息，可以稍后在世界编辑中添加
                      </p>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  返回
                </Button>
                <Button
                  variant="gold"
                  onClick={handleCreate}
                  disabled={!worldName.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      创造世界
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

