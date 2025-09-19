import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { BarChart3, TrendingUp, Target, Clock, Users, CheckCircle, AlertTriangle, Zap } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Аналитика и метрики</h1>
            <p className="text-muted-foreground">Отслеживайте эффективность ИИ-агента и качество работы</p>
          </div>

          {/* ML Metrics */}
          <div>
            <h2 className="text-lg font-medium text-foreground mb-4">Метрики машинного обучения</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Точность распознавания речи</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">94.2%</div>
                  <p className="text-xs text-muted-foreground">
                    WER (Word Error Rate): <span className="text-primary">5.8%</span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Качество выделения задач</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">87.5%</div>
                  <p className="text-xs text-muted-foreground">Precision: 89% • Recall: 86%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Время обработки</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">2.3 мин</div>
                  <p className="text-xs text-muted-foreground">Среднее время на 1 час записи</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Business Metrics */}
          <div>
            <h2 className="text-lg font-medium text-foreground mb-4">Бизнес-метрики</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Задач в Jira</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">89%</div>
                  <p className="text-xs text-muted-foreground">Корректно заведено автоматически</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Экономия времени</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">73%</div>
                  <p className="text-xs text-muted-foreground">Снижение времени на протоколирование</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Потерянных задач</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">-92%</div>
                  <p className="text-xs text-muted-foreground">Снижение по сравнению с ручным ведением</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Удовлетворенность команды</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">4.6/5</div>
                  <p className="text-xs text-muted-foreground">По результатам опроса (28 участников)</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Finансовая эффективность */}
          <div>
            <h2 className="text-lg font-medium text-foreground mb-4">Финансовая эффективность</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI проекта</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">340%</div>
                  <p className="text-xs text-muted-foreground">За первые 6 месяцев внедрения</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Экономия в месяц</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₸2.8М</div>
                  <p className="text-xs text-muted-foreground">Снижение операционных расходов</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Время окупаемости</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">3.2 мес</div>
                  <p className="text-xs text-muted-foreground">Полная окупаемость инвестиций</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Масштабируемость</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">500+</div>
                  <p className="text-xs text-muted-foreground">Потенциальных пользователей</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Бизнес-воздействие и ценность */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Бизнес-воздействие и ценность
              </CardTitle>
              <CardDescription>Измеримые результаты внедрения ИИ-агента для бизнеса</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Операционная эффективность:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Автоматизация 85% рутинных задач</li>
                    <li>• Сокращение времени встреч на 30%</li>
                    <li>• Увеличение пропускной способности на 45%</li>
                    <li>• Снижение человеческих ошибок на 78%</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Финансовые показатели:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Экономия ₸33.6М в год на зарплатах</li>
                    <li>• Снижение затрат на обучение на 60%</li>
                    <li>• Увеличение выручки на 25% за счет скорости</li>
                    <li>• Сокращение штрафов за просрочки на 90%</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Стратегические преимущества:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Конкурентное преимущество в отрасли</li>
                    <li>• Масштабируемость без пропорционального роста затрат</li>
                    <li>• Улучшение клиентского опыта на 40%</li>
                    <li>• Готовность к цифровой трансформации</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₸40.3М</div>
                    <p className="text-xs text-muted-foreground">Общая экономия за год</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">340%</div>
                    <p className="text-xs text-muted-foreground">ROI за 6 месяцев</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">+68%</div>
                    <p className="text-xs text-muted-foreground">Прирост продуктивности</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
