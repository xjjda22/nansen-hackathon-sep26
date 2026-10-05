"use client";

import {
  explorerLink,
  identiconCells,
  nansenTokenUrl,
  nansenWalletUrl,
  readTokenMark,
  shortAddress,
  splitRich,
  tokenIconUrl,
  type AddressKind,
  type TokenRef,
} from "@/lib/token-ref";
import Link from "next/link";
import { useState } from "react";

export function TokenFace({ symbol, chain, address, symbolHref }: TokenRef & { symbolHref?: string }) {
  const icon = tokenIconUrl(chain, address);
  const [iconFailed, setIconFailed] = useState(false);
  const cells = identiconCells(address || symbol);
  const name = symbol || "token";

  return (
    <span className="token-face">
      {icon && !iconFailed ? (
        <img className="token-icon" src={icon} alt="" width={18} height={18} onError={() => setIconFailed(true)} />
      ) : (
        <svg className="token-icon" viewBox="0 0 5 5" width={18} height={18} aria-hidden="true">
          {cells.map((on, index) =>
            on ? <rect key={index} x={index % 5} y={Math.floor(index / 5)} width={1} height={1} /> : null,
          )}
        </svg>
      )}
      {symbolHref ? (
        <Link className="token-symbol" href={symbolHref}>
          {name}
        </Link>
      ) : (
        <span className="token-symbol">{name}</span>
      )}
    </span>
  );
}

export function AddressLinks({
  label,
  chain,
  address,
  kind,
}: {
  label: string;
  chain: string;
  address: string;
  kind: AddressKind;
}) {
  const explorer = explorerLink(chain, address, kind);
  const nansen = kind === "wallet" ? nansenWalletUrl(address) : nansenTokenUrl(chain, address);
  return (
    <span className="address-links">
      <span className="address-label">{label}</span>
      <span className="token-address" title={address}>
        {shortAddress(address)}
      </span>
      <a className="token-out" href={nansen} target="_blank" rel="noreferrer">
        Nansen
      </a>
      {explorer ? (
        <a className="token-out" href={explorer.href} target="_blank" rel="noreferrer">
          {explorer.label}
        </a>
      ) : null}
    </span>
  );
}

export function TokenMark({ symbol, chain, address, symbolHref }: TokenRef & { symbolHref?: string }) {
  const [open, setOpen] = useState(false);
  if (symbolHref) {
    return (
      <span className="token-mark">
        <TokenFace symbol={symbol} chain={chain} address={address} symbolHref={symbolHref} />
        <AddressLinks label={symbol || "Token"} chain={chain} address={address} kind="token" />
      </span>
    );
  }
  return (
    <span className="token-mark token-chip-wrap" data-open={open}>
      <button type="button" className="token-chip" aria-expanded={open} title={`${symbol || "Token"} on ${chain}. Click for the address and links.`} onClick={() => setOpen(!open)}>
        <TokenFace symbol={symbol} chain={chain} address={address} />
      </button>
      {open ? <AddressLinks label={symbol || "Token"} chain={chain} address={address} kind="token" /> : null}
    </span>
  );
}

export function WalletMark({ chain, address }: { chain: string; address: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="token-mark token-chip-wrap" data-open={open}>
      <button type="button" className="token-chip wallet-chip" aria-expanded={open} title="Wallet. Click for the address and links." onClick={() => setOpen(!open)}>
        Wallet <span className="token-address">{shortAddress(address)}</span>
      </button>
      {open ? <AddressLinks label="Wallet" chain={chain} address={address} kind="wallet" /> : null}
    </span>
  );
}

export function RichText({ text }: { text: string }) {
  const parts = splitRich(text);
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "text") return <span key={index}>{part.text}</span>;
        if (part.kind === "wallet") return <WalletMark key={index} chain={part.chain} address={part.address} />;
        return <TokenMark key={index} symbol={part.token.symbol} chain={part.token.chain} address={part.token.address} />;
      })}
    </>
  );
}

export function TokenName({ name }: { name: string }) {
  const [head, trader] = name.split(" · ");
  const mark = readTokenMark(head ?? name);
  if (mark) {
    return (
      <span className="token-name">
        <TokenMark symbol={mark.symbol} chain={mark.chain} address={mark.address} />
        {trader ? <RichText text={trader} /> : null}
      </span>
    );
  }
  return <RichText text={name} />;
}
