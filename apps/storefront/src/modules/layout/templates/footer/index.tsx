import { listCategories } from "@lib/data/categories";
import { listCollections } from "@lib/data/collections";
import { getStoreConfig } from "@lib/data/store-config";
import { Text, clx } from "@modules/common/components/ui";
import Image from "next/image";

import LocalizedClientLink from "@modules/common/components/localized-client-link";

export default async function Footer() {
  const storeConfig = await getStoreConfig();
  const { collections } = await listCollections({
    fields: "*products",
  });
  const productCategories = await listCategories();

  return (
    <footer className="bg-ink text-white w-full">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-10 xsmall:flex-row items-start justify-between py-24">
          <div className="max-w-xs">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-x-2 group w-fit"
            >
              <Image
                src="/logo/4.png"
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <span className="font-display text-2xl uppercase group-hover:text-red-400 transition-colors">
                {storeConfig.shortName}
              </span>
            </LocalizedClientLink>
            <Text className="txt-small text-white/50 mt-3">
              Kabar drop, ukuran yang kembali tersedia, dan kode langganan -
              satu email per minggu.
            </Text>
            <form className="mt-4 flex gap-x-2">
              <input
                type="email"
                placeholder="nama@email.com"
                className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-small-regular text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 flex-1"
              />
              <button
                type="submit"
                className="rounded-full bg-red-500 hover:bg-red-600 text-white text-small-regular font-semibold px-5 py-2 uppercase tracking-wide"
              >
                Daftar
              </button>
            </form>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-4">
            {productCategories && productCategories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-white uppercase tracking-wide text-xs">
                  Belanja
                </span>
                <ul
                  className="grid grid-cols-1 gap-2"
                  data-testid="footer-categories"
                >
                  {productCategories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return;
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null;

                    return (
                      <li
                        className="flex flex-col gap-2 text-white/60 txt-small"
                        key={c.id}
                      >
                        <LocalizedClientLink
                          className={clx(
                            "hover:text-white",
                            children && "txt-small-plus"
                          )}
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children &&
                              children.map((child) => (
                                <li key={child.id}>
                                  <LocalizedClientLink
                                    className="hover:text-white"
                                    href={`/categories/${child.handle}`}
                                    data-testid="category-link"
                                  >
                                    {child.name}
                                  </LocalizedClientLink>
                                </li>
                              ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus text-white uppercase tracking-wide text-xs">
                  Koleksi
                </span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-white/60 txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="hover:text-white"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus text-white uppercase tracking-wide text-xs">
                Panduan
              </span>
              <ul className="grid grid-cols-1 gap-y-2 text-white/60 txt-small">
                <li>
                  <LocalizedClientLink
                    href="/blog"
                    className="hover:text-white"
                  >
                    Jurnal
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/stories"
                    className="hover:text-white"
                  >
                    Cerita produk
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus text-white uppercase tracking-wide text-xs">
                Bantuan
              </span>
              <ul className="grid grid-cols-1 gap-y-2 text-white/60 txt-small">
                <li>
                  <LocalizedClientLink
                    href="/account"
                    className="hover:text-white"
                  >
                    Lacak pesanan
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/account"
                    className="hover:text-white"
                  >
                    Tukar &amp; kembali
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-10 justify-between text-white/40">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} {storeConfig.name}. Hak cipta
            dilindungi.
          </Text>
        </div>
      </div>
    </footer>
  );
}
