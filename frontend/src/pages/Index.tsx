import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GoogleLogin } from "@react-oauth/google";
import { ArrowRight, Sparkles, ChevronRight, Zap, Target, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUser, setToken, setUser } from "@/lib/auth";

const features = [
  {
    title: "Анализ навыков",
    description: "AI определяет ваши сильные стороны и точки роста на основе опыта и образования",
    icon: Target,
    color: "terracotta",
  },
  {
    title: "Персональный маршрут",
    description: "Пошаговый план с курсами, практикой и реалистичными сроками",
    icon: TrendingUp,
    color: "terracotta",
  },
  {
    title: "Динамическая адаптация",
    description: "План корректируется по мере вашего прогресса и изменения приоритетов",
    icon: Zap,
    color: "terracotta",
  },
];

const capabilities = [
  "Определение навыков под целевую профессию",
  "Подбор курсов и материалов",
  "Формирование учебного графика",
  "Подготовка резюме и портфолио",
  "Помощь в прохождении собеседований",
];

const Index = () => {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const user = getUser();
  const [showLogin, setShowLogin] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleSuccess = async (resp: { credential?: string }) => {
    if (!resp.credential) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: resp.credential }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || "Ошибка входа");
      setToken(body.token);
      setUser(body.user);
      setShowLogin(false);
      navigate("/profile");
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-[15%] w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-40 left-[10%] w-96 h-96 bg-primary/6 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 right-[20%] w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Возможности
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Как это работает
              </a>
              {loggedIn ? (
                <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="hover:border-primary hover:text-primary">
                  {user?.picture && <img src={user.picture} alt="" className="w-5 h-5 rounded-full mr-1" />}
                  Мой профиль
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setLoginError(null); setShowLogin(true); }} className="hover:border-primary hover:text-primary">
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="container mx-auto">
          <div className="max-w-3xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-sm mb-8 animate-shimmer" style={{ backgroundSize: '200% 100%' }}>
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">AI-платформа для карьеры</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-foreground leading-[1.1] mb-6">
              Найди свой<br />
              <span className="text-terracotta-vibrant">путь к мечте</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Персональная дорожная карта развития от текущего уровня до работы мечты. 
              На основе ваших данных, целей и возможностей.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="xl" 
                onClick={() => navigate("/onboarding")}
                className="group shadow-accent hover:shadow-glow transition-all duration-300"
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" size="xl" className="text-muted-foreground hover:text-primary group">
                Узнать больше
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Hero decorative shape */}
          <div className="absolute right-0 top-32 hidden lg:block">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 animate-float" />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/8 animate-float-delayed" />
              <div className="absolute inset-16 rounded-full bg-card border border-border/50 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities list */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="container mx-auto">
          <div className="bg-primary/10 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {capabilities.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 text-sm text-foreground/80 hover:text-primary transition-colors group"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 group-hover:scale-125 transition-transform" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              Всё для <span className="text-terracotta-vibrant">карьерного роста</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              NextPath использует AI для создания вашего уникального плана развития
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const colorClasses = {
                terracotta: "from-primary/20 to-primary/5 border-primary/20 hover:border-primary/40",
                sage: "from-sage/20 to-sage/5 border-sage/20 hover:border-sage/40",
                golden: "from-golden/20 to-golden/5 border-golden/20 hover:border-golden/40",
              };
              const iconBg = {
                terracotta: "bg-primary/10 text-primary",
                sage: "bg-sage/10 text-sage",
                golden: "bg-golden/10 text-golden",
              };
              return (
                <div
                  key={idx}
                  className={`p-8 rounded-2xl bg-gradient-to-b ${colorClasses[feature.color as keyof typeof colorClasses]} border card-interactive`}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${iconBg[feature.color as keyof typeof iconBg]} flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        
        <div className="container mx-auto">
          <div className="bg-primary/10 rounded-3xl p-10 md:p-16">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              Как это <span className="text-terracotta-vibrant">работает</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Три простых шага к персональной дорожной карте
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Расскажите о себе",
                description: "Заполните профиль: образование, опыт, навыки и карьерные цели",
                accent: "primary",
              },
              {
                step: "02",
                title: "AI создаёт план",
                description: "Алгоритм анализирует данные и строит оптимальный маршрут развития",
                accent: "sage",
              },
              {
                step: "03",
                title: "Следуйте карте",
                description: "Изучайте материалы, выполняйте задания и отслеживайте прогресс",
                accent: "golden",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="text-8xl font-serif leading-none mb-4 transition-all duration-300 text-primary/40 group-hover:text-primary/60">
                  {item.step}
                </div>
                <h3 className="text-2xl font-serif text-foreground mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        
        <div className="container mx-auto relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 text-sm mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-foreground">Начните сегодня — это бесплатно</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
              Готовы <span className="text-terracotta-vibrant">начать</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Создайте персональную дорожную карту и сделайте первый шаг к карьере мечты
            </p>
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate("/onboarding")}
              className="group shadow-accent hover:shadow-glow transition-all duration-300"
            >
              Создать дорожную карту
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Login dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Войти в NextPath</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {loginLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Входим...
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Войдите, чтобы сохранить дорожную карту и отслеживать прогресс
                </p>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setLoginError("Не удалось войти через Google")}
                  locale="ru"
                  text="signin_with"
                  shape="rectangular"
                  size="large"
                />
                {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border bg-secondary/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 NextPath. <span className="text-primary/80">Всегда есть другой путь.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;