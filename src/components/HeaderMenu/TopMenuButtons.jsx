import {
  FileTextOutlined,
  SettingOutlined,
  CalculatorOutlined,
    HomeOutlined,
    EditOutlined
} from "@ant-design/icons";

const TopMenuButtons = [
    {
        location: "/",
        icon: <HomeOutlined />,
        title: "",
        shape: 'circle',
        size: 'medium'

    },
    {
        location: "/settings",
        icon: <SettingOutlined />,
        title: "",
        shape: 'circle',
        size: 'medium'

    },
    {
        location: "/calculator",
        icon: <CalculatorOutlined />,
        title: "Калькулятор",
        shape: 'round',
        size: 'medium'


    },
    {
        location: "/calculator-manual",
        icon: <EditOutlined />,
        title: "Ручной ввод",
        shape: 'round',
        size: 'medium'


    },
    {
        location: "/docs",
        icon: <FileTextOutlined />,
        title: "Документация",
        shape: 'round',
        size: 'medium'


    },
    
  ];

export default TopMenuButtons;