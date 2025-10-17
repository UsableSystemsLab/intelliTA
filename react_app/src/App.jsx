import Main from "./components/MainSection";
import Header from "./components/Header";
import Footer from "./components/Footer";
export default function App() {
  return (
    <div className="app">
      <header>
      <Header />
      </header>
      <main className="main-content">
        <Main />
      </main>
      <footer>
        <Footer />
      </footer>
    </div>
  );
}
