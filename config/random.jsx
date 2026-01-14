import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, X, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { searchProducts } from "../api/product.api";

const Navbar = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const menuItems = ["Home", "Browse products", "Login/Register"];
  const categoryItems = [
    "Auto Parts",
    "Small car parts",
    "Trucks & Heavy Duty",
    "Building Materials",
    "Electronics",
  ];

  /* ---------------- SEARCH LOGIC ---------------- */

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const res = await searchProducts(searchQuery);
      setSearchResults(res || []);
      setSearchLoading(false);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const goToProduct = (id) => {
    navigate(`/product/${id}`);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  return (
    <div className="relative" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* TOP BAR */}
      <div className="flex justify-between items-center px-4 py-3 md:justify-center">
        {/* Mobile menu */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(true)}>
            <X />
          </button>
        </div>

        <div className="text-lg font-semibold">AJAHMART</div>

        {/* Desktop search */}
        <div className="hidden md:flex relative w-1/3 mx-4">
          <div className="border border-black flex items-center w-full">
            <input
              type="text"
              placeholder="Search for a product"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 outline-none"
            />
            <div className="px-2">
              <Search />
            </div>
          </div>

          {searchQuery && (
            <div className="absolute top-full left-0 w-full bg-white border z-50 max-h-80 overflow-y-auto">
              {searchLoading && <p className="p-3 text-sm text-gray-500">Searching...</p>}
              {!searchLoading && searchResults.length === 0 && (
                <p className="p-3 text-sm text-gray-500">No results found</p>
              )}
              {searchResults.map((p) => (
                <div
                  key={p._id}
                  onClick={() => goToProduct(p._id)}
                  className="p-3 cursor-pointer hover:bg-gray-100 border-b"
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-600">₦{p.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop menu + cart */}
        <div className="hidden md:flex items-center gap-4">
          {["home", "shop", "auth"].map((label) => (
            <Link
              key={label}
              to={`/${label === "home" ? "" : label}`}
              className="px-3"
            >
              {label === "auth" ? "login/register" : label}
            </Link>
          ))}

          <button onClick={() => setIsCartOpen(true)} className="relative">
            <ShoppingBag />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.reduce((a, i) => a + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile search + cart */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={() => setIsSearchOpen(true)}>
            <Search />
          </button>
          <button onClick={() => setIsCartOpen(true)} className="relative">
            <ShoppingBag />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.reduce((a, i) => a + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CART SIDEBAR */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          isCartOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setIsCartOpen(false)}
      ></div>

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)}>
            <X />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4 max-h-full overflow-y-auto">
          {cart.length === 0 && <p className="text-gray-500">Your cart is empty.</p>}

          {cart.map((item) => (
            <div key={item._id + (item.variation?.name || "")} className="flex justify-between items-start border-b pb-2">
              <div className="flex flex-col gap-1">
                <p className="font-semibold">{item.name}</p>
                {item.variation && (
                  <p className="text-sm text-gray-600">Variation: {item.variation.name}</p>
                )}
                <p className="text-sm text-gray-600">
                  ₦{(item.price * item.quantity).toLocaleString()}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    className="border px-2 py-1 rounded hover:bg-gray-200"
                    onClick={() => updateQuantity(item._id, Math.max(item.quantity - 1, 1), item.variation)}
                  >
                    -
                  </button>
                  <span className="border px-3 py-1 rounded w-12 text-center">{item.quantity}</span>
                  <button
                    className="border px-2 py-1 rounded hover:bg-gray-200"
                    onClick={() =>
                      updateQuantity(item._id, item.quantity + 1, item.variation)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item._id, item.variation)}
                className="text-red-500 font-bold cursor-pointer"
              >
                <Trash2 />
              </button>
            </div>
          ))}

          {cart.length > 0 && (
            <div className="mt-4 border-t pt-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">
                  Total: ₦{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                </span>
                <button
                  onClick={() => clearCart()}
                  className="text-red-500 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Trash2 /> Clear
                </button>
              </div>

              <Link
                to="/checkout"
                className="bg-black text-white w-full py-3 rounded font-semibold hover:bg-gray-800 flex justify-center items-center"
              >
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
