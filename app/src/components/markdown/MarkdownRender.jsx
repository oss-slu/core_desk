import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Typography } from "tabler-react-2";
import { Alert } from "tabler-react-2/dist/alert";

const { H1, H2, H3, H4, H5, H6, Text, B, I } = Typography;

String.prototype.toSentenceCase = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

// Custom component to handle ::: admonitions
const Admonition = ({ children }) => {
  const switchTypeForColor = (type) => {
    switch (type) {
      case "tip":
        return "success";
      case "info":
        return "primary";
      case "danger":
        return "red";
      case "caution":
        return "warning";
      case "note":
        return "purple";
      default:
        return "primary";
    }
  };

  // The type will immediately follow the :::
  const type = children.toString().split(":::")[1].split("\n")[0].trim();

  // The content will be everything after the type and before the closing :::
  const content = children.toString().split("\n")[1];

  return (
    <Alert variant={switchTypeForColor(type)} title={type.toSentenceCase()}>
      {content}
    </Alert>
  );
};

export const MarkdownRender = ({ markdown }) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <H1>{children}</H1>,
        h2: ({ children }) => <H2>{children}</H2>,
        h3: ({ children }) => <H3>{children}</H3>,
        h4: ({ children }) => <H4>{children}</H4>,
        h5: ({ children }) => <H5>{children}</H5>,
        h6: ({ children }) => <H6>{children}</H6>,
        // p: ({ children }) => <Text>{children}</Text>,
        p: ({ children }) =>
          children.toString()?.startsWith(":::") ? (
            <Admonition>{children}</Admonition>
          ) : (
            <Text>{children}</Text>
          ),
        strong: ({ children }) => <B>{children}</B>,
        b: ({ children }) => <B>{children}</B>,
        em: ({ children }) => <I>{children}</I>,
        i: ({ children }) => <I>{children}</I>,
        img: ({ src, alt }) => (
          <div style={{ width: "100%", textAlign: "center" }}>
            <img
              data-image="IMAGE"
              src={src}
              alt={alt}
              style={{
                maxWidth: "100%",
                height: 300,
                objectFit: "cover",
              }}
            />
            <i>
              <Text>{alt}</Text>
            </i>
          </div>
        ),
      }}
    >
      {markdown}
    </Markdown>
  );
};
