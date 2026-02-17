import {
  CloudOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  ClusterOutlined,
  ApiOutlined,
  RocketOutlined,
} from "@ant-design/icons";

export const gases = [
  {
    key: "oxygen",
    shortName: "O₂",
    label: "Кислород (O₂)",
    color: "#4282D3",
    icon: <CloudOutlined />,
    unit: "л/сут",
    formulaSymbolic: "Vₒ₂ = Vₘ × Nₒ₂ × Kₒ₂ × tₒ₂ × 60",
    formulaText:
      "Расход кислорода = Номинальный расход Vₘ × Кол-во точек Nₒ₂ × Коэффициент использования Kₒ₂ × Время tₒ₂ × 60 (мин → сут)",
    calc: (V_m, N, K, t) => V_m * N * K * t * 60,
  },

  {
    key: "n2o",
    shortName: "N₂O",
    label: "Закись азота (N₂O)",
    color: "#00C90D",
    icon: <ExperimentOutlined />,
    unit: "л/сут",
    formulaSymbolic: "Vₙ₂ₒ = Vₘ × Nₙ₂ₒ × Kₙ₂ₒ × tₙ₂ₒ × 60",
    formulaText:
      "Расход закиси азота = Номинальный расход Vₘ × Кол-во точек Nₙ₂ₒ × Коэффициент использования Kₙ₂ₒ × Время tₙ₂ₒ × 60 (мин → сут)",
    calc: (V_m, N, K, t) => V_m * N * K * t * 60,
  },

  {
    key: "co2",
    shortName: "CO₂",
    label: "Углекислый газ (CO₂)",
    color: "#575757ff",
    icon: <FireOutlined />,
    unit: "л/сут",
    formulaSymbolic: "Vco₂ = Vₘ × Nco₂ × Kco₂ × tco₂ × 60",
    formulaText:
      "Расход CO₂ = Номинальный расход Vₘ × Кол-во точек Nco₂ × Коэффициент использования Kco₂ × Время tco₂ × 60 (мин → сут)",
    calc: (V_m, N, K, t) => V_m * N * K * t * 60,
  },

  {
    key: "air5",
    shortName: "Air5",
    label: "Сжатый воздух 0.4 МПа (Air 5)",
    color: "#FF9340",
    icon: <ThunderboltOutlined />,
    unit: "л/сут",
    formulaSymbolic: "Vair5 = Vₘ × Nair × Kair",
    formulaText:
      "Расход сжатого воздуха 0.4 МПа = Номинальный расход Vₘ × Кол-во точек Nair × Коэффициент использования Kair",
    calc: (V_m, N, K) => V_m * N * K,
  },

  {
    key: "air8",
    shortName: "Air8",
    label: "Сжатый воздух 0.8 МПа (Air 8)",
    color: "#A63A00",
    icon: <DashboardOutlined />,
    unit: "л/мин",
    formulaSymbolic: "Vair8 = 350 × Nair × Kair",
    formulaText:
      "Расход воздуха 0.8 МПа = 350 л/мин × Кол-во точек Nair × Коэффициент одновременности Kair (0.7–0.3)",
    calc: (N, K) => 350 * N * K,
  },

  {
    key: "agss",
    shortName: "AGSS",
    label: "AGSS (Удаление анестетиков)",
    color: "#FFD773",
    icon: <SafetyCertificateOutlined />,
    unit: "л/сут",
    formulaSymbolic: "Vagss = Vₘ × Nagss × Kagss",
    formulaText:
      "Расход AGSS = Номинальный расход Vₘ × Кол-во точек Nagss × Коэффициент использования Kagss",
    calc: (V_m, N, K) => V_m * N * K,
  },

  {
    key: "vacuum",
    shortName: "VAC",
    label: "Вакуум",
    color: "#FD3F49",
    icon: <DeleteOutlined />,
    unit: "л/мин",
    formulaSymbolic: "Vvac = Vₘ × Nvac × Kvac",
    formulaText:
      "Расход вакуума = Номинальный расход Vₘ × Кол-во точек Nvac × Коэффициент одновременности Kvac (0.7 / 0.3)",
    calc: (V_m, N, K) => V_m * N * K,
  },
];



/*
  flowRate - номинальный расход на одну точку, норм. л/мин
  hoursPerDay - Продолжительность использования в течение суток, ч
  usageFactor - Средний коэффициент использования
*/
export const rooms = [
  { type: "row", key: "operating", name: "Операционные",
    gases: [
      {key: 'oxygen', flowRate: 20, hoursPerDay: 5, usageFactor: 0.7 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 5, usageFactor: 0.7 },

      {key: 'vacuum', flowRate: 40, usageFactor: 0.7 },
      {key: 'air5', flowRate: 60, usageFactor: 0.7 },
      {key: 'air8', flowRate: 60, usageFactor: 0.7 },
      {key: 'co2', flowRate: 13, hoursPerDay: 1 },
      {key: 'agss', },


    ]
  },
  { type: "row", key: "small_operating", name: "Малые операционные", 
    gases: [
      {key: 'oxygen', flowRate: 20, hoursPerDay: 5, usageFactor: 0.4 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 5, usageFactor: 0.4 },

      {key: 'vacuum', flowRate: 40, usageFactor: 0.7},
      {key: 'air5', flowRate: 40, usageFactor: 0.4},
      {key: 'air8', flowRate: 40, usageFactor: 0.4},
      {key: 'co2', flowRate: 13, hoursPerDay: 1 },
      {key: 'agss', },

    ]
  },
  { type: "row", key: "anesthesia", name: "Наркозные",
    gases: [
      {key: 'oxygen', flowRate: 10, hoursPerDay: 1, usageFactor: 0.5 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 1, usageFactor: 0.5 },

      {key: 'vacuum', flowRate: 40, usageFactor: 0.3},
      {key: 'air5', flowRate: 40, usageFactor: 0.5},
      {key: 'air8', flowRate: 40, usageFactor: 0.5},
      {key: 'agss', },

    ]
  },
  { type: "row", key: "postoperative", name: "Послеоперационные палаты",
    gases: [
      {key: 'oxygen', flowRate: 8, hoursPerDay: 24, usageFactor: 0.5 },
      {key: 'vacuum', flowRate: 20, usageFactor: 0.3},

    ]
  },
  { type: "row", key: "embryo", name: "Эмбриологическая",
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 1.5, usageFactor: 0.3 },
      {key: 'co2', flowRate: 15, hoursPerDay: 1 },

    ]
  },
  { type: "row", key: "icu_adults", name: "Палаты интенсивной терапии для взрослых",
    gases: [
      {key: 'oxygen', flowRate: 8, hoursPerDay: 24, usageFactor: 1.0 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 6, usageFactor: 0.4 },

      {key: 'vacuum', flowRate: 20, usageFactor: 0.7},
      {key: 'air5', flowRate: 40, usageFactor: 1.0},
      {key: 'air8', flowRate: 40, usageFactor: 1.0},
      {key: 'agss', },

    ]
  },
  { type: "row", key: "icu_children_less_7_years", name: "Палаты интенсивной терапии для детей до 7 лет",
    gases: [
      {key: 'oxygen', flowRate: 2, hoursPerDay: 24, usageFactor: 1.0 },
      {key: 'n2o', flowRate: 1.5, hoursPerDay: 6, usageFactor: 0.4 },

      {key: 'vacuum', flowRate: 20, usageFactor: 0.7},
      {key: 'air5', flowRate: 10, usageFactor: 1.0},
      {key: 'air8', flowRate: 10, usageFactor: 1.0},
      {key: 'agss', },

    ]
  },
  { type: "row", key: "icu_children_more_7_years", name: "Палаты интенсивной терапии для детей старше 7 лет",
    gases: [
      {key: 'oxygen', flowRate: 2, hoursPerDay: 24, usageFactor: 1.0 },
      {key: 'n2o', flowRate: 3, hoursPerDay: 6, usageFactor: 0.4 },

      {key: 'vacuum', flowRate: 20, usageFactor: 0.7},
      {key: 'air5', flowRate: 10, usageFactor: 1.0},
      {key: 'air8', flowRate: 10, usageFactor: 1.0},
      {key: 'agss', },

    ]
  },
  { type: "row", key: "adults_rea", name: "Реанимационные залы для взрослых",
    gases: [
      {key: 'oxygen', flowRate: 9, hoursPerDay: 24, usageFactor: 1.0 },
      {key: 'air5', flowRate: 40, usageFactor: 1.0},
      {key: 'air8', flowRate: 40, usageFactor: 1.0},

    ]
  },
  { type: "row", key: "children_rea", name: "Реанимационные залы для детей",
    gases: [
      {key: 'oxygen', flowRate: 2, hoursPerDay: 24, usageFactor: 1.0 },
      {key: 'air5', flowRate: 10, usageFactor: 1.0},
      {key: 'air8', flowRate: 10, usageFactor: 1.0},

    ]
  },
  { type: "row", key: "angiography", name: "Манипуляционные, процедурные ангиографии, эндоскопии, бронхоскопии, стоматологии",
    gases: [
      {key: 'oxygen', flowRate: 10, hoursPerDay: 5, usageFactor: 0.4 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 5, usageFactor: 0.4 },

      {key: 'vacuum', flowRate: 20, usageFactor: 0.3},
      {key: 'air5', flowRate: 10, usageFactor: 0.4},
      {key: 'air8', flowRate: 10, usageFactor: 0.4},

      {key: 'co2', flowRate: 13, hoursPerDay: 1 },
      {key: 'agss', },


    ]
  },
  { type: "row", key: "bandage", name: "Перевязочные и процедурные отделений, помещения забора крови, помещения подготовки больного ЯМРТ и КТ, процедурные ЯМРТ, помещения экстренной помощи, смотровые; прививочные, кабинеты гипертермии, залы гемодиализа и другие кабинеты эфферентной терапии, кабинеты электрокардиографии, кабинеты аллергологии, отсек краткосрочного пребывания, фильтр распределения пациентов по степени тяжести, помещение инфузионной терапии (в отделении химиотерапии)",
    gases: [
      {key: 'oxygen', flowRate: 6, hoursPerDay: 2, usageFactor: 0.2 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 2, usageFactor: 0.2 },
      {key: 'vacuum', flowRate: 10, usageFactor: 0.3},
      {key: 'air5', flowRate: 10, usageFactor: 0.2},
      {key: 'air8', flowRate: 10, usageFactor: 0.2},

    ]
  },

  { type: "row", key: "onkology", name: "Онкологические",
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 1.5, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.4 },
      {key: 'air8', flowRate: 10, usageFactor: 0.4 },

    ]
  },
  { type: "row", key: "cardio", name: "Кардиологические",
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 6, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.4 },
      {key: 'air8', flowRate: 10, usageFactor: 0.4 },


    ]
  },
  { type: "row", key: "burn", name: "Ожоговые",
    gases: [
      {key: 'oxygen', flowRate: 6, hoursPerDay: 6, usageFactor: 0.3 },
      {key: 'n2o', flowRate: 5, hoursPerDay: 6, usageFactor: 0.4 },

      {key: 'vacuum', flowRate: 20, usageFactor: 0.3},
      {key: 'air5', flowRate: 10, usageFactor: 0.6 },
      {key: 'air8', flowRate: 10, usageFactor: 0.6 },

    ]
  },
  { type: "row", key: "gynecology", name: "Гинекологические", 
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 10, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.7 },
      {key: 'air8', flowRate: 10, usageFactor: 0.7 },

    ]
  },
  { type: "row", key: "pregnancy_patalogy", name: "Патологии беременности",
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 10, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.8 },
      {key: 'air8', flowRate: 10, usageFactor: 0.8 },

    ]
  },
  { type: "row", key: "posrt_pregnancy", name: "Послеродовые (для родильниц) ",
    gases: [
      {key: 'oxygen', flowRate: 8, hoursPerDay: 10, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.7 },
      {key: 'air8', flowRate: 10, usageFactor: 0.7 },
      {key: 'agss', },

    ]
  },
  { type: "row", key: "newborn", name: "Послеродовые (для новорожденных)",
    gases: [
      {key: 'oxygen', flowRate: 2, hoursPerDay: 9, usageFactor: 0.3 },
      {key: 'vacuum', flowRate: 10, usageFactor: 0.7},
      {key: 'agss', },

    ]
   },
  { type: "row", key: "pregnancy", name: "Родовые",
    gases: [
      {key: 'oxygen', flowRate: 9, hoursPerDay: 12, usageFactor: 0.4 },
      {key: 'n2o', flowRate: 6, hoursPerDay: 6, usageFactor: 0.5 },

      {key: 'air5', flowRate: 10, usageFactor: 0.8 },
      {key: 'air8', flowRate: 10, usageFactor: 0.8 },
      {key: 'agss', },
    ]
  },
  { type: "row", key: "general", name: "Палаты на 1-2 койки",
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 1.5, usageFactor: 0.3 },
      {key: 'vacuum', flowRate: 10, usageFactor: 0.3},

    ]
  },
  { type: "row", key: "premature", name: "Отделения выхаживания недоношенных детей",
    gases: [
      {key: 'oxygen', flowRate: 2, hoursPerDay: 24, usageFactor: 0.8 },
      {key: 'vacuum', flowRate: 10, usageFactor: 0.3},
      {key: 'air5', flowRate: 60, usageFactor: 0.8 },
      {key: 'air8', flowRate: 60, usageFactor: 0.8 },

    ]
  },

  { type: "row", key: "less_1_year", name: "Отделения для детей в возрасте до 1-го года ",
    gases: [
      {key: 'oxygen', flowRate: 2, hoursPerDay: 6, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.8 },
      {key: 'air8', flowRate: 10, usageFactor: 0.8 },

    ]
  },
  { type: "row", key: "year_1_7", name: "Отделения для детей в возрасте с 1-го года до 7 лет ",
    gases: [
      {key: 'oxygen', flowRate: 3, hoursPerDay: 6, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.7 },
      {key: 'air8', flowRate: 10, usageFactor: 0.7 },

    ]
  },
  { type: "row", key: "more_7_years", name: "Отделения для детей старше 7 лет",
    gases: [
      {key: 'oxygen', flowRate: 4, hoursPerDay: 6, usageFactor: 0.3 },
      {key: 'air5', flowRate: 10, usageFactor: 0.7 },
      {key: 'air8', flowRate: 10, usageFactor: 0.7 },

    ]
  },
];

