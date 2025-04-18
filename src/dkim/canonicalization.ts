import { EmailHeader } from "../email";
import { DkimHeader } from "./header";
import { selectSigningHeaders } from "./signingHeader";

enum Canonicalization {
  Simple = "simple",
  Relaxed = "relaxed",
}

// latter is for header, former is for body
type DkimCanonicalization = [Canonicalization, Canonicalization];

export const newCanonicalization = (c?: string): DkimCanonicalization => {
  if (!c) {
    return [Canonicalization.Relaxed, Canonicalization.Relaxed];
  } else if (c.includes("/")) {
    const [headerCanon, bodyCanon] = c.split("/");
    return [
      headerCanon === "simple"
        ? Canonicalization.Simple
        : Canonicalization.Relaxed,
      bodyCanon === "simple"
        ? Canonicalization.Simple
        : Canonicalization.Relaxed,
    ];
  } else {
    return [
      c === "simple" ? Canonicalization.Simple : Canonicalization.Relaxed,
      Canonicalization.Simple,
    ];
  }
};

export const canonicalizationToStr = (c: DkimCanonicalization): string => {
  return `${c[0]}/${c[1]}`;
};

export const canonicalize = (
  c: DkimCanonicalization,
  header: string,
  body: string,
): [string, string] => {
  return [
    c[0] === Canonicalization.Simple
      ? simpleHeader(header)
      : relaxedHeader(header),
    c[1] === Canonicalization.Simple ? simpleBody(body) : relaxedBody(body),
  ];
};

export const relaxedHeaders = (
  dkim: DkimHeader,
  headers: EmailHeader[],
): string => {
  const { h } = dkim;
  const signingHeaders = selectSigningHeaders(h, headers);
  let header = "";
  for (const { key, value } of signingHeaders) {
    header += key.toLowerCase();
    header += ":";
    header += relaxedHeader(value);
    header += "\r\n";
  }

  return header;
};

const relaxedHeader = (header: string): string => {
  header = header.replace(/\t/g, " ");

  header = header.replace(/\r\n/g, "");

  while (header.endsWith(" ")) {
    header = header.slice(0, -1);
  }

  while (header.startsWith(" ")) {
    header = header.slice(1);
  }

  let previous = false;
  header = header
    .split("")
    .filter((c) => {
      if (c === " ") {
        if (previous) {
          return false;
        } else {
          previous = true;
          return true;
        }
      } else {
        previous = false;
        return true;
      }
    })
    .join("");

  return header;
};

export const simpleHeader = (header: string): string => {
  return header.replace(/\s+/g, " ").trim();
};

// https://tools.ietf.org/html/rfc6376#section-3.4.4
export const relaxedBody = (body: string): string => {
  body = body.replace(/\t/g, " ");

  body = body.replace(/ +/g, " ");

  body = body.replace(/ +\r\n/g, "\r\n");

  while (body.endsWith("\r\n\r\n")) {
    body = body.slice(0, -2);
  }

  if (body.length > 0 && !body.endsWith("\r\n")) {
    body += "\r\n";
  }

  return body;
};

export const simpleBody = (body: string): string => {
  return body.replace(/\s+/g, " ").trim();
};
