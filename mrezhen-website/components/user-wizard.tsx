'use client'

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "motion/react"
import { userInfoSchema, type UserInfoValues } from "@/lib/schemas/user-info"
import { submitOnboarding } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTranslations } from "next-intl"

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return ""
  return new Date(date).toISOString().split('T')[0]
}

export function UserInfoWizard({ initialData }: { initialData?: any }) {
  const t = useTranslations("onboarding")
  const tCommon = useTranslations("common")
  const [currentStep, setCurrentStep] = useState(0)
  const [previousStep, setPreviousStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const steps = [
    { id: 1, title: t("step1Title"), description: t("step1Desc") },
    { id: 2, title: t("step2Title"), description: t("step2Desc") },
    { id: 3, title: t("step3Title"), description: t("step3Desc") },
    { id: 4, title: t("step4Title"), description: t("step4Desc") },
    { id: 5, title: t("step5Title"), description: t("step5Desc") },
  ]
  
  const form = useForm<UserInfoValues>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: {
      username: initialData?.username || "",
      name: initialData?.name || "",
      
      bio: initialData?.bio || "",
      interests: initialData?.interests ? initialData.interests.join(", ") : "",
      dateOfBirth: formatDateForInput(initialData?.dateOfBirth), 
      gender: initialData?.gender || "",
      education: initialData?.education || "",
      maritalStatus: initialData?.maritalStatus || "",
      
      householdSize: initialData?.householdSize || 1,
      childrenCount: initialData?.childrenCount || 0,
      socialSupportLevel: initialData?.socialSupportLevel || "medium",
      
      childhoodMathSkill: initialData?.childhoodMathSkill || 5,
      booksInHome: initialData?.booksInHome || "11-25",
      
      bmi: initialData?.bmi || undefined,
      smoking: initialData?.smoking || "never",
      alcoholConsumption: initialData?.alcoholConsumption || "none",
      mentalHealthScore: initialData?.mentalHealthScore || 5,
      
      employmentStatus: initialData?.employmentStatus || "employed",
      incomePercentile: initialData?.incomePercentile || 50,
    },
    mode: "onChange", 
  })

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  }

  const direction = currentStep > previousStep ? 1 : -1

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate as any)
    
    if (isValid) {
      setPreviousStep(currentStep)
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        onSubmit(form.getValues())
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep)
      setCurrentStep(prev => prev - 1)
    }
  }

  function onSubmit(data: UserInfoValues) {
    startTransition(async () => {
      const result = await submitOnboarding(data)
      if (result?.error) {
        // If specific field error (like username taken), set it in the form
        if (result.error.toLowerCase().includes("username")) {
            form.setError("username", { type: "manual", message: result.error })
        } else {
            alert(`Error: ${result.error}`)
        }
      } else {
        console.log("Profile updated successfully")
      }
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>{t("stepOf", { n: currentStep + 1, total: steps.length })}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <Card className="border-border shadow-sm overflow-hidden min-h-[600px] flex flex-col justify-between">
            <CardHeader className="bg-muted border-b pb-6">
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-8 flex-grow relative overflow-hidden bg-card">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  {renderStepContent(currentStep, form, t, tCommon)}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-muted p-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0 || isPending}
                className="w-32"
              >
                {tCommon("back")}
              </Button>
              <Button 
                onClick={nextStep} 
                disabled={isPending}
                className="w-32 bg-foreground text-background hover:bg-foreground/90"
              >
                {isPending ? tCommon("saving") : (currentStep === steps.length - 1 ? t("saveProfile") : tCommon("next"))}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}

function getFieldsForStep(step: number): string[] {
  switch (step) {
    case 0: return ["username", "name", "dateOfBirth", "gender", "bio", "interests", "education", "maritalStatus"]
    case 1: return ["householdSize", "childrenCount", "socialSupportLevel"]
    case 2: return ["childhoodMathSkill", "booksInHome"]
    case 3: return ["bmi", "smoking", "alcoholConsumption", "mentalHealthScore"]
    case 4: return ["employmentStatus", "incomePercentile"]
    default: return []
  }
}

function renderStepContent(step: number, form: any, t: any, tCommon: any) {
  switch (step) {
    case 0: // Demographics + Bio + Interests + Identity
      return (
        <div className="space-y-6">
          {/* Identity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg border border-border">
            <FormField control={form.control} name="username" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("username")} <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder={t("usernamePlaceholder")} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription className="text-[10px]">{t("usernameDesc")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("displayName")} <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder={t("displayNamePlaceholder")} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("shortBio")}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t("bioPlaceholder")} 
                  className="resize-none h-20" 
                  {...field} 
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("dateOfBirth")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("gender")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={tCommon("select")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="male">{t("male")}</SelectItem>
                    <SelectItem value="female">{t("female")}</SelectItem>
                    <SelectItem value="non-binary">{t("nonBinary")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="interests" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("interestsHobbies")}</FormLabel>
              <FormControl>
                <Input placeholder={t("interestsPlaceholder")} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>{t("interestsHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="education" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("education")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("highestDegree")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="high_school">{t("highSchool")}</SelectItem>
                    <SelectItem value="bachelors">{t("bachelors")}</SelectItem>
                    <SelectItem value="masters">{t("masters")}</SelectItem>
                    <SelectItem value="phd">{t("phd")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="maritalStatus" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("maritalStatus")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder={t("statusPlaceholder")} /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="single">{t("single")}</SelectItem>
                    <SelectItem value="married">{t("married")}</SelectItem>
                    <SelectItem value="divorced">{t("divorced")}</SelectItem>
                    <SelectItem value="widowed">{t("widowed")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>
      )

    case 1: // Household
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="householdSize" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("householdSize")}</FormLabel>
                <FormControl>
                    <Input type="number" min={1} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? 1} />
                </FormControl>
                <FormDescription>{t("householdSizeDesc")}</FormDescription>
                <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="childrenCount" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("children")}</FormLabel>
                <FormControl>
                    <Input type="number" min={0} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? 0} />
                </FormControl>
                <FormDescription>{t("childrenDesc")}</FormDescription>
                <FormMessage />
                </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="socialSupportLevel" render={({ field }) => (
            <FormItem className="space-y-3 pt-4 border-t">
              <FormLabel>{t("socialSupport")}</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="low" /></FormControl>
                    <FormLabel className="font-normal">{t("supportLow")}</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="medium" /></FormControl>
                    <FormLabel className="font-normal">{t("supportMedium")}</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value="high" /></FormControl>
                    <FormLabel className="font-normal">{t("supportHigh")}</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )
    
    case 2: // Childhood
      return (
        <div className="space-y-8">
            <FormField control={form.control} name="booksInHome" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("booksAtAge10")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t("selectAmount")} /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="0-10">{t("books0_10")}</SelectItem>
                    <SelectItem value="11-25">{t("books11_25")}</SelectItem>
                    <SelectItem value="26-100">{t("books26_100")}</SelectItem>
                    <SelectItem value="100+">{t("books100plus")}</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="childhoodMathSkill" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg">{t("mathSkills", { value: field.value })}</FormLabel>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{t("struggled")}</span>
                <Slider min={1} max={10} step={1} defaultValue={[field.value || 5]} onValueChange={(val) => field.onChange(val[0])} className="flex-1" />
                <span className="text-sm text-muted-foreground">{t("genius")}</span>
              </div>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )

    case 3: // Health
      return (
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField control={form.control} name="smoking" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("smokingHistory")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={tCommon("select")} /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="never">{t("neverSmoked")}</SelectItem>
                    <SelectItem value="former">{t("formerSmoker")}</SelectItem>
                    <SelectItem value="current">{t("currentSmoker")}</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />

             <FormField control={form.control} name="alcoholConsumption" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("alcohol")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={tCommon("select")} /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="none">{t("alcoholNone")}</SelectItem>
                    <SelectItem value="social">{t("socially")}</SelectItem>
                    <SelectItem value="regular">{t("regularly")}</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )} />
           </div>

           <FormField control={form.control} name="bmi" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("bmiLabel")}</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder={t("bmiPlaceholder")} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>{t("bmiDesc")}</FormDescription>
                <FormMessage />
                </FormItem>
            )} />

           <FormField control={form.control} name="mentalHealthScore" render={({ field }) => (
            <FormItem className="pt-4 border-t">
              <FormLabel className="text-lg">{t("recentMood")}</FormLabel>
              <div className="flex items-center gap-4">
                <span className="text-2xl">😊</span>
                <Slider min={0} max={10} step={1} defaultValue={[field.value]} onValueChange={(val) => field.onChange(val[0])} className="flex-1" />
                <span className="text-2xl">😔</span>
              </div>
              <p className="text-center font-bold text-xl mt-2">{field.value}</p>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      )

    case 4: // Work & Money
        return (
            <div className="space-y-6">
              <FormField control={form.control} name="employmentStatus" render={({ field }) => (
                <FormItem>
                <FormLabel>{t("currentEmployment")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={tCommon("select")} /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="employed">{t("employedFull")}</SelectItem>
                    <SelectItem value="part_time">{t("partTimeJob")}</SelectItem>
                    <SelectItem value="self_employed">{t("selfEmployed")}</SelectItem>
                    <SelectItem value="retired">{t("retired")}</SelectItem>
                    <SelectItem value="unemployed">{t("unemployed")}</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
              )} />

            <FormField control={form.control} name="incomePercentile" render={({ field }) => (
                <FormItem>
                <FormLabel className="text-lg">{t("incomePercentile")}</FormLabel>
                <FormControl>
                    <Input type="number" min={0} max={100} {...field} onChange={e => field.onChange(+e.target.value)} value={field.value ?? 50} />
                </FormControl>
                <FormDescription>
                    {t("incomeDesc")}
                </FormDescription>
                <FormMessage />
                </FormItem>
            )} />
            </div>
        )
  }
}