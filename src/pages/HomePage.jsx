import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Card, theme, Space } from "antd";
import {
  RocketOutlined,
  SettingOutlined,
  FileSearchOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const isDark = token.colorBgBase === "#141414" || token.colorTextBase === "#fff";

  const cards = [
    {
      icon: <RocketOutlined style={{ color: "#4096ff" }} />,
      title: "Удобные расчёты",
      text: "Вычисляйте расход, давление и запас баллонов по каждому газу — точно и быстро",
      path: "/calculator",
      gradient: "linear-gradient(135deg, rgba(64,150,255,0.15), rgba(0,80,179,0.2))",
    },
    {
      icon: <SettingOutlined style={{ color: "#52c41a" }} />,
      title: "Гибкие настройки",
      text: "Настраивайте цвета, параметры и помещения под свой проект — всё сохраняется",
      path: "/settings",
      gradient: "linear-gradient(135deg, rgba(82,196,26,0.15), rgba(22,77,0,0.2))",
    },
    {
      icon: <FileSearchOutlined style={{ color: "#fa541c" }} />,
      title: "Подробная документация",
      text: "Изучайте принципы расчёта и используемые формулы в удобной справке",
      path: "/docs",
      gradient: "linear-gradient(135deg, rgba(250,84,28,0.15), rgba(90,29,0,0.2))",
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 16px",
        color: token.colorText,
        position: "relative",
        overflow: "hidden",
        background: token.colorBgBase,
      }}
    >
      {/* ==== Заголовок ==== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{
          textAlign: "center",
          maxWidth: 720,
          zIndex: 2,
        }}
      >
        <Title
          level={1}
          style={{
            fontWeight: 700,
            fontSize: "3.2rem",
            lineHeight: 1.2,
            textShadow: isDark ? "0 0 24px rgba(48,117,255,0.4)" : "none",
            marginBottom: 30,
            color: token.colorTextHeading,
          }}
        >
          Калькулятор медицинских газов
        </Title>

        <Text
          style={{
            fontSize: 18,
            display: "block",
            marginBottom: 40,
            color: token.colorTextSecondary,
          }}
        >
          Инструмент нового поколения для инженеров и проектировщиков по&nbsp;СП&nbsp;158.13330.2014 — точность, удобство и вдохновение в одном интерфейсе
        </Text>

        <Space size="middle" wrap style={{ justifyContent: 'center' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Button
              type="primary"
              size="large"
              shape='round'
              icon={<RocketOutlined />}
              onClick={() => navigate("/calculator")}
              style={{
                background: "linear-gradient(90deg, #3571ff, #1e90ff)",
                border: "none",
                boxShadow: isDark
                  ? "0 0 25px rgba(48,117,255,0.5)"
                  : "0 0 15px rgba(48,117,255,0.3)",
                padding: "0 40px",
                height: 56,
                fontSize: 18,
              }}
            >
              Начать расчёт
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Button
              size="large"
              shape='round'
              onClick={() => navigate("/settings?tab=about")}
              style={{
                padding: "0 32px",
                height: 56,
                fontSize: 16,
                borderColor: token.colorPrimary,
                color: token.colorPrimary,
              }}
            >
              Обновление 0.1.1
            </Button>
          </motion.div>
        </Space>
      </motion.div>

      {/* ==== Карточки ==== */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 1 }}
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 20,
          marginTop: 80,
          zIndex: 2,
        }}
      >
        {cards.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.15, duration: 0.6 }}
          >
            <Card
              bordered={false}
              hoverable
              onClick={() => navigate(item.path)}
              style={{
                width: 350,
                height: 260,
                textAlign: "center",
                padding: 20,
                cursor: "pointer",
                background: item.gradient,
                backdropFilter: "blur(8px)",
                boxShadow: isDark
                  ? "0 0 8px rgba(255,255,255,0.05)"
                  : "0 2px 10px rgba(0,0,0,0.08)",
                transition: "transform 0.3s, box-shadow 0.3s, background 0.3s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = isDark
                  ? "0 0 18px rgba(255,255,255,0.25)"
                  : "0 4px 20px rgba(0,0,0,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = isDark
                  ? "0 0 8px rgba(255,255,255,0.05)"
                  : "0 2px 10px rgba(0,0,0,0.08)")
              }
            >
              <div style={{ fontSize: 38, marginBottom: 12 }}>{item.icon}</div>
              <Title
                level={4}
                style={{
                  marginBottom: 6,
                  fontWeight: 600,
                  color: token.colorTextHeading,
                }}
              >
                {item.title}
              </Title>
              <Text
                type="secondary"
                style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: token.colorTextSecondary,
                }}
              >
                {item.text}
              </Text>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ==== Футер ==== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.2 }}
        style={{
          position: "absolute",
          bottom: 20,
          fontSize: 12,
          color: token.colorTextQuaternary,
          letterSpacing: 0.3,
        }}
      >
        © {new Date().getFullYear()} ТМГ ДИН
      </motion.div>
    </div>
  );
}
