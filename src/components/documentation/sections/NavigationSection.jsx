import React from "react";
import { Card, Typography } from "antd";
import docsNavigationVideo from "../../../video/docs_navigation.mp4";

const { Paragraph } = Typography;

export default function NavigationSection() {
  return (
    <Card title="Навигация в документации" bordered>
      <Paragraph
        style={{
          fontSize: 16,
          marginBottom: 16,
        }}
      >
        Переключайтесь между разными секциями
      </Paragraph>

      <video
        src={docsNavigationVideo}
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: "100%",
           borderRadius: "8px",
          display: "block",
          pointerEvents: "none", // чтобы нельзя было кликнуть
        }}
      />
    </Card>
  );
}
