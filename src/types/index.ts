export type DisasterType =
  | 'typhoon'
  | 'flood'
  | 'drought'
  | 'earthquake'
  | 'tsunami'
  | 'wildfire'
  | 'volcano'
  | 'tornado'
  | 'blizzard'
  | 'heatwave'

export interface DisasterEvent {
  id: string
  name: string
  type: DisasterType
  date: string
  year: number
  lat: number
  lng: number
  intensity: number
  deaths: number
  affected: number
  economicLoss: number
  description: string
  country: string
}

export const disasterTypeConfig: Record<DisasterType, {
  label: string
  color: string
  icon: string
}> = {
  typhoon:    { label: '台风',   color: '#FF6B6B', icon: '🌀' },
  flood:      { label: '洪水',   color: '#4ECDC4', icon: '🌊' },
  drought:    { label: '干旱',   color: '#F7DC6F', icon: '☀' },
  earthquake: { label: '地震',   color: '#C0392B', icon: '🏚' },
  tsunami:    { label: '海啸',   color: '#2980B9', icon: '🌊' },
  wildfire:   { label: '山火',   color: '#E67E22', icon: '🔥' },
  volcano:    { label: '火山',   color: '#E74C3C', icon: '🌋' },
  tornado:    { label: '龙卷风', color: '#9B59B6', icon: '🌪' },
  blizzard:   { label: '暴风雪', color: '#AED6F1', icon: '❄' },
  heatwave:   { label: '热浪',   color: '#F39C12', icon: '🌡' },
}

// Formation process stage
export interface FormationStage {
  id: string
  title: string
  description: string
  duration: number // seconds
  diagram: string // CSS/ASCII diagram description
  keyPoints: string[]
}

export const formationData: Record<DisasterType, {
  title: string
  summary: string
  stages: FormationStage[]
}> = {
  typhoon: {
    title: '台风（热带气旋）形成过程',
    summary: '台风是一种强烈的热带气旋，形成于热带或亚热带海洋上，需要特定的海洋和大气条件。',
    stages: [
      {
        id: 't1', title: '热带扰动', duration: 3,
        description: '在热带海洋上，海水温度超过26.5°C时，海水大量蒸发，形成低压区。暖湿空气上升，周围空气汇聚补充。',
        diagram: '   💨 上升暖湿气流\n   ↓\n≈≈≈ 暖海面 (>26.5°C) ≈≈≈\n空气汇聚 → 低压区形成',
        keyPoints: ['海面温度必须 > 26.5°C', '海水大量蒸发', '形成低压中心']
      },
      {
        id: 't2', title: '热带低压', duration: 3,
        description: '低压区不断加深，对流云组织化，在地转偏向力作用下，气流开始旋转。中心气压持续下降。',
        diagram: '    ↙  ↖\n  ↙  低压  ↖\n    ↘  ↗\n科里奥利力 → 气旋旋转',
        keyPoints: ['地转偏向力作用', '对流云组织化', '中心气压 < 1000hPa']
      },
      {
        id: 't3', title: '热带风暴', duration: 3,
        description: '风速达到17.2-24.4 m/s，螺旋云带明显形成。台风眼开始出现，眼壁对流强烈。',
        diagram: '    ╭───╮\n    │🌀│ 螺旋云带\n    ╰───╯\n最大风速 17-24 m/s\n→ 正式命名',
        keyPoints: ['风速达热带风暴级别', '螺旋结构形成', '获得命名']
      },
      {
        id: 't4', title: '强台风/登陆', duration: 4,
        description: '台风强度达到峰值，眼壁清晰，中心气压极低。台风登陆后，失去海洋能量来源，逐渐减弱消散。',
        diagram: '    ╔═══╗\n   ║ 🌀 ║ 清晰台风眼\n    ╚═══╝\n最大风速 > 32.7 m/s\n登陆 → 减弱 → 消散',
        keyPoints: ['台风眼清晰', '中心气压极低', '登陆后减弱']
      },
    ]
  },
  flood: {
    title: '洪水形成过程',
    summary: '洪水是指河流、湖泊或沿海地区的水位超过正常范围，淹没陆地形成的灾害。',
    stages: [
      {
        id: 'f1', title: '水汽输送', duration: 2,
        description: '大气环流将水汽从海洋输送到陆地上空。季风、台风等天气系统带来大量水汽，为降水提供条件。',
        diagram: '🌊 水汽蒸发 → ☁ 输送 → 🏔 陆地\n暖湿气流沿地形抬升',
        keyPoints: ['海洋水汽蒸发', '大气环流输送', '地形抬升作用']
      },
      {
        id: 'f2', title: '强降水', duration: 2,
        description: '水汽在上升过程中冷却凝结，形成持续性强降水。极端情况下，数小时内可降下数月雨量。',
        diagram: '☁☁☁ 厚云层\n  ↓↓↓\n💧💧💧 持续暴雨\n小时雨量 > 50mm → 极端降水',
        keyPoints: ['水汽凝结成云', '持续性强降水', '小时雨量超标']
      },
      {
        id: 'f3', title: '径流汇聚', duration: 2,
        description: '降水超过地表入渗能力，地表径流沿地形向低洼处汇聚，河流水量迅速增加。',
        diagram: '    ⛰ 山地\n   / ↓ \\\n  /  ↓  \\\n 🌊→→→🌊 径流汇聚\n水量超河道容量',
        keyPoints: ['地表径流汇聚', '河道水量暴涨', '超过排水能力']
      },
      {
        id: 'f4', title: '漫堤泛滥', duration: 3,
        description: '河水超过堤坝高度或堤坝溃决，洪水漫出河道，淹没沿岸城市和农田，造成灾害。',
        diagram: '~~~ 洪水溢出 ~~~\n═══╦═══ 堤坝\n≈≈≈≈≈≈≈ 淹没区\n城市/农田被淹',
        keyPoints: ['水位超过堤坝', '可能发生溃坝', '城市农田被淹']
      },
    ]
  },
  drought: {
    title: '干旱形成过程',
    summary: '干旱是长期降水不足导致的水分短缺现象。',
    stages: [
      {
        id: 'd1', title: '降水偏少', duration: 2,
        description: '由于大气环流异常（如高压系统长期盘踞），水汽输送受阻，降水量显著低于常年平均值。',
        diagram: '☀☀☀ 高压盘踞\n  ↓\n☁️ → 云层被抑制\n长期无有效降水',
        keyPoints: ['高压系统长期控制', '水汽输送受阻', '降水持续偏少']
      },
      {
        id: 'd2', title: '土壤缺水', duration: 2,
        description: '地表蒸发量大于补给量，土壤含水量持续下降。植物开始出现水分胁迫，农作物生长受阻。',
        diagram: '🌱→🌿→🥀 作物萎蔫\n地表蒸发 > 降水补给\n土壤墒情恶化',
        keyPoints: ['土壤水分流失', '作物出现胁迫', '灌溉水源不足']
      },
      {
        id: 'd3', title: '水源枯竭', duration: 2,
        description: '河流流量减少甚至断流，水库水位大幅下降，地下水位持续走低。人畜饮水出现困难。',
        diagram: '🏞 河流断流\n🪣 水库见底\n⛏ 井水干涸\n→ 供水危机',
        keyPoints: ['地表水枯竭', '地下水位下降', '供水出现危机']
      },
      {
        id: 'd4', title: '生态灾害', duration: 3,
        description: '大规模植被死亡，土地沙化加剧，粮食绝收，严重时可引发饥荒和社会危机。',
        diagram: '🏜 土地沙化\n🌾→❌ 粮食绝收\n⚠ 饥荒风险\n需要人工干预和援助',
        keyPoints: ['植被大面积死亡', '粮食严重减产', '可能引发饥荒']
      },
    ]
  },
  earthquake: {
    title: '地震形成过程',
    summary: '地震是地壳中积累的应力突然释放，以地震波的形式向四周传播。',
    stages: [
      {
        id: 'e1', title: '板块应力积累', duration: 3,
        description: '地球板块持续缓慢运动（每年几厘米），在板块边界积累弹性应变能。断层两侧岩石被相互锁定。',
        diagram: '→│← 板块挤压\n→│← (应力积累)\n张力超过岩石强度',
        keyPoints: ['板块持续运动', '断层相互锁定', '弹性应变能积累']
      },
      {
        id: 'e2', title: '断层破裂', duration: 2,
        description: '当积累的应力超过岩石的破裂强度时，断层突然错动，释放巨大能量。破裂以每秒数公里的速度沿断层传播。',
        diagram: '  ⚡ 断层破裂\n ↘  ↗\n   ↙ ↖\n地震波向四周传播',
        keyPoints: ['应力超过强度极限', '断层突然错动', '破裂高速传播']
      },
      {
        id: 'e3', title: '地震波传播', duration: 2,
        description: 'P波（纵波）最先到达，S波（横波）紧随其后，面波（瑞利波、勒夫波）沿地表传播，造成最大破坏。',
        diagram: 'P波 → ═══ (压缩波)\nS波 → ∿∿∿ (剪切波)\n面波 → 〰〰〰 (最破坏)',
        keyPoints: ['P波最快到达', 'S波造成摇晃', '面波破坏力最强']
      },
      {
        id: 'e4', title: '余震与次生灾害', duration: 3,
        description: '主震后发生多次余震，可能引发山体滑坡、海啸、火灾、房屋倒塌等次生灾害。建筑物倒塌是主要伤亡原因。',
        diagram: '🏚→💥 建筑倒塌\n🔥 火灾\n🌊 海啸 (如海底地震)\n⛰→💨 山体滑坡',
        keyPoints: ['余震持续发生', '建筑倒塌致伤亡', '可能引发海啸']
      },
    ]
  },
  tsunami: {
    title: '海啸形成过程',
    summary: '海啸主要由海底地震、火山喷发或海底滑坡引发，产生一系列波长极长的海洋波动。',
    stages: [
      {
        id: 'ts1', title: '海底地震/扰动', duration: 2,
        description: '海底地震（一般>7.0级）导致海底地壳垂直位移，大体积海水被突然抬升或下降。',
        diagram: '═══╗ 海底错动\n   ║ ↑↓\n≈≈≈≈≈ 海水被抬升',
        keyPoints: ['海底垂直位移', '大体积水被扰动', '一般M>7级地震']
      },
      {
        id: 'ts2', title: '波浪传播', duration: 2,
        description: '扰动以极快速度（相当于喷气式飞机）向四周扩散。在深海中波高仅几十厘米，但波长可达数百公里。',
        diagram: '→→→→→ 高速传播\n≈≈≈≈≈≈≈≈≈≈\n深海波高<1m 波长>100km',
        keyPoints: ['速度达800km/h', '深海波高很小', '波长极长']
      },
      {
        id: 'ts3', title: '近岸增高', duration: 2,
        description: '波浪进入浅水区，波速减慢，后浪追赶前浪，波高急剧增大，形成"水墙"。海水先退后涨。',
        diagram: '   ╱╲╱╲╱╲\n  ╱  ╲  ╲\n ╱海水 ╲ ╲\n→ 先退潮 → 巨浪扑来',
        keyPoints: ['浅水区波高急增', '海水先退后涨', '形成水墙']
      },
      {
        id: 'ts4', title: '登陆冲击', duration: 3,
        description: '巨浪以极大动能冲上陆地，摧毁建筑物和基础设施。波浪反复进退，造成持续破坏，内涝时间长。',
        diagram: '🌊🌊🌊 巨浪冲击\n══════ 海岸线\n💥💥💥 建筑摧毁\n≈≈≈ 长期内涝',
        keyPoints: ['巨动能冲击', '波浪反复进退', '内涝持续时间长']
      },
    ]
  },
  wildfire: {
    title: '山火形成过程',
    summary: '山火（森林火灾）需要三个要素：可燃物、助燃物（氧气）和火源，加上干燥和风力条件。',
    stages: [
      {
        id: 'w1', title: '干燥条件', duration: 2,
        description: '持续高温干旱导致植被含水量极低，枯枝落叶形成大量可燃物。空气湿度下降至危险水平。',
        diagram: '☀☀ 持续高温\n🌡 >35°C 湿度<20%\n🌿→🍂 植被极度干燥',
        keyPoints: ['高温干旱环境', '植被含水量低', '枯枝落叶堆积']
      },
      {
        id: 'w2', title: '起火', duration: 2,
        description: '火源（雷击、人为、电线火花等）引燃干燥植被。小火焰迅速蔓延到周围可燃物，形成火头。',
        diagram: '⚡ 雷击 / 🚬 人为\n   ↓\n🔥 引燃干燥植被\n火头形成 → 蔓延',
        keyPoints: ['自然/人为火源', '干燥植被易点燃', '火头形成']
      },
      {
        id: 'w3', title: '风力助推', duration: 2,
        description: '强风为火场供应充足氧气，推动火焰快速蔓延。飞火（火星飞散）可在远处引发新火点。',
        diagram: '💨💨💨 强风\n🔥→🔥→🔥 火线推进\n✨→🔥 飞火引发新火点',
        keyPoints: ['强风供应氧气', '火线快速推进', '飞火引发新火灾']
      },
      {
        id: 'w4', title: '极端火行为', duration: 3,
        description: '大火形成自己的天气系统——火积云和火龙卷。火焰高度可达数十米，蔓延速度极快，难以控制。',
        diagram: '☁🔥 火积云\n  🔥\n 🌪🔥 火龙卷\n火势失控 → 大范围破坏',
        keyPoints: ['形成自身天气系统', '火焰速度极快', '灭火困难']
      },
    ]
  },
  volcano: {
    title: '火山喷发过程',
    summary: '火山喷发是地幔岩浆通过地壳裂缝上升到地表的过程。',
    stages: [
      {
        id: 'v1', title: '岩浆上升', duration: 3,
        description: '地幔中的岩浆比周围岩石密度小，在浮力作用下沿地壳薄弱带上升。岩浆中含有大量溶解气体。',
        diagram: '  🌋\n  ║\n ╔╩╗ 岩浆房\n═══╝ 地幔热柱上升',
        keyPoints: ['地幔岩浆上升', '密度差驱动', '沿地壳薄弱带']
      },
      {
        id: 'v2', title: '压力积聚', duration: 2,
        description: '岩浆中的溶解气体在接近地表时压力降低，气体出溶形成气泡，体积急剧膨胀。',
        diagram: '💨 气体出溶\n🫧🫧🫧 气泡膨胀\n⬆ 内部压力↑↑↑\n地表隆起',
        keyPoints: ['气体出溶膨胀', '内部压力急增', '地表形变']
      },
      {
        id: 'v3', title: '猛烈喷发', duration: 2,
        description: '压力超过上覆岩层强度，发生猛烈喷发。火山灰柱可达数十公里高度，喷出大量碎屑物质和熔岩。',
        diagram: '💥💥💥 猛烈喷发\n  ╱☁╲\n ╱火山灰╲\n🌋 熔岩流',
        keyPoints: ['压力突破岩层', '火山灰柱数十公里', '熔岩和碎屑喷出']
      },
      {
        id: 'v4', title: '火山灾害', duration: 3,
        description: '火山灰覆盖大面积区域，影响航空和气候。火山碎屑流速度极快且致命，可能引发海啸和泥石流。',
        diagram: '☁☁☁ 火山灰扩散\n🌊→ 可能引发海啸\n⛰💨 火山泥石流\n气候降温效应',
        keyPoints: ['火山灰影响航空', '碎屑流致命', '全球气温下降']
      },
    ]
  },
  tornado: {
    title: '龙卷风形成过程',
    summary: '龙卷风是强烈的旋转气柱，从积雨云底延伸到地面，是最猛烈的大气现象之一。',
    stages: [
      {
        id: 'to1', title: '超级单体发展', duration: 2,
        description: '在不稳定大气中，强垂直风切变使上升气流旋转，形成超级单体雷暴（中气旋）。',
        diagram: '  ☁☁☁ 积雨云\n  ↖ ↗\n ↙ 中气旋 ↖\n强上升气流 + 风切变',
        keyPoints: ['大气极不稳定', '强垂直风切变', '中气旋形成']
      },
      {
        id: 'to2', title: '漏斗云下沉', duration: 2,
        description: '旋转气流在中气旋底部集中，形成可见的漏斗云。漏斗云从云底向下延伸，不断旋转。',
        diagram: '  ☁☁☁\n    ‖\n    ▼ 漏斗云下沉\n  旋转加速',
        keyPoints: ['旋转气流集中', '漏斗云形成', '从云底向下延伸']
      },
      {
        id: 'to3', title: '触地', duration: 2,
        description: '漏斗云接触地面，成为龙卷风。中心气压极低（可低于正常值100hPa），最大风速可达130m/s以上。',
        diagram: '  ☁☁☁\n   ║\n 🌪║🌪 触地!\n最大风速 > 130 m/s',
        keyPoints: ['接触地面', '中心气压极低', '风速巨大']
      },
      {
        id: 'to4', title: '破坏与消散', duration: 3,
        description: '龙卷风沿地面移动，路径上建筑物被彻底摧毁。当上升气流减弱或冷空气进入时，龙卷风逐渐消散。',
        diagram: '🏚→💨 建筑粉碎\n→→→ 移动路径\n冷空气入 → 消散',
        keyPoints: ['路径破坏力强', 'EF等级分类', '冷空气导致消散']
      },
    ]
  },
  blizzard: {
    title: '暴风雪形成过程',
    summary: '暴风雪是强风与大雪同时发生的极端冬季天气现象，能见度极低，气温骤降。',
    stages: [
      {
        id: 'b1', title: '冷暖气团交汇', duration: 2,
        description: '极地冷气团南下与暖湿气团相遇，形成强烈的温度梯度和锋面系统。',
        diagram: '❄→ 极地冷空气\n   ⚡ 激烈交汇\n←🌊 暖湿气流\n→ 强锋面系统形成',
        keyPoints: ['冷暖气团交汇', '温度梯度大', '锋面系统发展']
      },
      {
        id: 'b2', title: '强降雪', duration: 2,
        description: '暖湿气流被迫沿冷空气爬升，水汽凝结形成大量降雪。降雪速率可达每小时5厘米以上。',
        diagram: '☁☁☁ 厚雪云\n↓↓↓↓↓ 暴雪\n❄❄❄❄❄ 积雪速增\n>5cm/h',
        keyPoints: ['暖湿气流爬升', '水汽快速凝结', '降雪速率极高']
      },
      {
        id: 'b3', title: '强风+低温', duration: 2,
        description: '伴随风速超过56 km/h的强风，气温降至-10°C以下。风寒效应使人感知温度低至-30°C甚至更低。',
        diagram: '💨💨💨 强风 >56km/h\n❄❄❄❄❄ 暴雪\n🌡 -10°C以下\n体感温度 -30°C',
        keyPoints: ['风速>56km/h', '持续3小时以上', '风寒效应显著']
      },
      {
        id: 'b4', title: '积雪成灾', duration: 3,
        description: '积雪深度迅速超过1米，交通完全瘫痪，电力线路被冰压断，建筑物屋顶负荷超限可能坍塌。',
        diagram: '❄❄❄❄❄\n⛄ 积雪>1m\n🚗❌ 交通瘫痪\n⚡❌ 断电\n🏠⚠ 屋顶超载',
        keyPoints: ['积雪超1米', '交通电力中断', '屋顶坍塌风险']
      },
    ]
  },
  heatwave: {
    title: '热浪形成过程',
    summary: '热浪是持续数天甚至数周的极端高温天气，常与异常的大气环流模式有关。',
    stages: [
      {
        id: 'h1', title: '高压系统控制', duration: 2,
        description: '强大的高压系统（热穹顶）盘踞在区域上空，阻止云层形成和降水，太阳辐射持续加热地表。',
        diagram: '☀☀☀ 强太阳辐射\n  ╔═══╗\n  ║ 高压║ 热穹顶\n  ╚═══╝\n无云、无降水',
        keyPoints: ['热穹顶锁定', '云层被抑制', '持续日照加热']
      },
      {
        id: 'h2', title: '热量累积', duration: 2,
        description: '地表和建筑白天吸收热量，夜间无法有效散热。热岛效应使城市温度比郊区高3-7°C。每天热量持续累加。',
        diagram: '☀→🏙 白天吸热\n🌙→🏙 夜间无法散热\n→ 逐日累加热量\n城市热岛 +3~7°C',
        keyPoints: ['夜间散热不足', '城市热岛效应', '热量逐日累加']
      },
      {
        id: 'h3', title: '极端高温', duration: 2,
        description: '气温连续多日超过历史极值。夜间最低气温也居高不下（热带夜），人体无法得到休息恢复。',
        diagram: '🌡🌡🌡 持续高温\n     >40°C\n🌙 夜间>25°C\n→ 人体无法恢复',
        keyPoints: ['日间极端高温', '夜间温度不降', '人体无恢复期']
      },
      {
        id: 'h4', title: '健康危机', duration: 3,
        description: '持续高温导致中暑、热射病等健康问题，老年人、户外工作者和慢性病患者风险最高。严重时可造成大规模死亡。',
        diagram: '🥵 中暑/热射病\n💔 心血管压力\n🏥 医疗系统承压\n⚠ 高危人群死亡',
        keyPoints: ['中暑热射病增加', '老人高危', '医疗系统超载']
      },
    ]
  },
}

// Performance settings
export interface QualitySettings {
  cloudSegments: number
  globeSegments: number
  markerDetail: number
  particleCount: number
  antialias: boolean
}

export const qualityPresets: Record<string, QualitySettings> = {
  high: {
    cloudSegments: 48,
    globeSegments: 64,
    markerDetail: 16,
    particleCount: 3000,
    antialias: true,
  },
  medium: {
    cloudSegments: 32,
    globeSegments: 48,
    markerDetail: 12,
    particleCount: 1500,
    antialias: false,
  },
  low: {
    cloudSegments: 24,
    globeSegments: 32,
    markerDetail: 8,
    particleCount: 800,
    antialias: false,
  },
}
