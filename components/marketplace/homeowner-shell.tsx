"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, MessageCircle, UserRound } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
const OwnerContext = createContext("");
export const useHomeownerOwner = () => useContext(OwnerContext);
const DraftContext = createContext<(key: string, dirty: boolean) => void>(
  () => {},
);
export function useHomeownerDraft(
  key: string,
  dirty: boolean,
  onDiscard: () => void,
) {
  const set = useContext(DraftContext);
  const latest = useRef(onDiscard);
  latest.current = onDiscard;
  useEffect(() => {
    set(key, dirty);
    return () => set(key, false);
  }, [set, key, dirty]);
  useEffect(() => {
    const reset = () => latest.current();
    window.addEventListener("wellkept:discard", reset);
    return () => window.removeEventListener("wellkept:discard", reset);
  }, []);
}
export function discardChanges(dirty: boolean) {
  return !dirty || window.confirm("Discard your unsaved changes?");
}
export function HomeownerHeader() {
  return (
    <header className="hk-brand">
      <Link href="/customer" aria-label="Well Kept, Jobs">
        Well Kept<span aria-hidden="true">✦</span>
      </Link>
    </header>
  );
}
export function HomeownerShell({
  children,
  unreadIds,
  ownerId,
}: {
  children: ReactNode;
  unreadIds: string[];
  ownerId: string;
}) {
  const pathname = usePathname();
  const thread = /^\/customer\/messages\/[^/]+$/.test(pathname);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [unread, setUnread] = useState(unreadIds);
  const count = unread.length;
  const register = useCallback(
    (key: string, value: boolean) =>
      setDirty((d) => (d[key] === value ? d : { ...d, [key]: value })),
    [],
  );
  useEffect(() => setUnread(unreadIds), [unreadIds]);
  useEffect(() => {
    const read = (e: Event) => {
      const id = (e as CustomEvent).detail?.bidId;
      if (id) setUnread((ids) => ids.filter((x) => x !== id));
    };
    window.addEventListener("wellkept:activity-read", read);
    return () => window.removeEventListener("wellkept:activity-read", read);
  }, []);
  useEffect(() => {
    const any = Object.values(dirty).some(Boolean);
    const before = (e: BeforeUnloadEvent) => {
      if (any) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      const link = (e.target as Element)?.closest("a[href]");
      if (
        any &&
        link &&
        !link.hasAttribute("data-preserve-draft") &&
        !link.getAttribute("href")?.startsWith("#")
      ) {
        if (!discardChanges(true)) {
          e.preventDefault();
          e.stopPropagation();
        } else window.dispatchEvent(new Event("wellkept:discard"));
      }
    };
    window.addEventListener("beforeunload", before);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", before);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
  useEffect(() => {
    const key = "hk-scroll:" + pathname;
    const restore = requestAnimationFrame(() =>
      window.location.hash
        ? document
            .getElementById(window.location.hash.slice(1))
            ?.scrollIntoView()
        : window.scrollTo(0, Number(sessionStorage.getItem(key) ?? 0)),
    );
    const save = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      cancelAnimationFrame(restore);
      window.removeEventListener("scroll", save);
    };
  }, [pathname]);
  return (
    <OwnerContext.Provider value={ownerId}>
      <DraftContext.Provider value={register}>
        <div className={`hk-app${thread ? " hk-thread-app" : ""}`}>
          {children}
          {!thread && (
            <nav className="hk-bottom-nav" aria-label="Homeowner navigation">
              {[
                { href: "/customer", label: "Jobs", Icon: House },
                {
                  href: "/customer/messages",
                  label: "Messages",
                  Icon: MessageCircle,
                },
                {
                  href: "/customer/account",
                  label: "Account",
                  Icon: UserRound,
                },
              ].map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    replace
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={
                        active ? "hk-nav-item is-active" : "hk-nav-item"
                      }
                    >
                      <span className="hk-nav-icon">
                        <Icon
                          fill={
                            active && label === "Jobs" ? "currentColor" : "none"
                          }
                        />
                        {label === "Messages" && count > 0 && (
                          <b aria-label={`${count} unread conversations`}>
                            {count > 99 ? "99+" : count}
                          </b>
                        )}
                      </span>
                      <span>{label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </DraftContext.Provider>
    </OwnerContext.Provider>
  );
}
