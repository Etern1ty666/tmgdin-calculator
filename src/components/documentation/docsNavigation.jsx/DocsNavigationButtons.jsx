import {
  CloudOutlined,
  ExperimentOutlined,
  FireOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  CompassOutlined,
} from "@ant-design/icons";

const DocsGasButtons = [
  {
    location: "/docs/navigation",
    icon: <CompassOutlined />,
    title: "Навигация",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/oxygen",
    icon: <CloudOutlined />,
    title: "Кислород (O₂)",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/n2o",
    icon: <ExperimentOutlined />,
    title: "Закись азота (N₂O)",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/co2",
    icon: <FireOutlined />,
    title: "Углекислый газ (CO₂)",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/air5",
    icon: <ThunderboltOutlined />,
    title: "Air 5",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/air8",
    icon: <DashboardOutlined />,
    title: "Air 8",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/agss",
    icon: <SafetyCertificateOutlined />,
    title: "AGSS",
    shape: "round",
    size: "middle",
  },
  {
    location: "/docs/vacuum",
    icon: <DeleteOutlined />,
    title: "Вакуум",
    shape: "round",
    size: "middle",
  },
];

export default DocsGasButtons;
