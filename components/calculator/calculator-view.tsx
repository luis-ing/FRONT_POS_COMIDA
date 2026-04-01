"use client"

import { useState } from "react"
import { Delete, Plus, Minus, X, Divide, Equal, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CalculatorView() {
  const [display, setDisplay] = useState("0")
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === "0" ? digit : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.")
      setWaitingForOperand(false)
      return
    }
    if (!display.includes(".")) {
      setDisplay(display + ".")
    }
  }

  const clear = () => {
    setDisplay("0")
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue
      let newValue = currentValue

      switch (operation) {
        case "+":
          newValue = currentValue + inputValue
          break
        case "-":
          newValue = currentValue - inputValue
          break
        case "×":
          newValue = currentValue * inputValue
          break
        case "÷":
          newValue = currentValue / inputValue
          break
        case "%":
          newValue = (currentValue * inputValue) / 100
          break
      }

      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = () => {
    if (previousValue === null || operation === null) return

    const inputValue = parseFloat(display)
    let newValue = previousValue

    switch (operation) {
      case "+":
        newValue = previousValue + inputValue
        break
      case "-":
        newValue = previousValue - inputValue
        break
      case "×":
        newValue = previousValue * inputValue
        break
      case "÷":
        newValue = previousValue / inputValue
        break
      case "%":
        newValue = (previousValue * inputValue) / 100
        break
    }

    setDisplay(String(newValue))
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(true)
  }

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay("0")
    }
  }

  const CalcButton = ({
    children,
    onClick,
    variant = "default",
    className,
  }: {
    children: React.ReactNode
    onClick: () => void
    variant?: "default" | "operation" | "action" | "equal"
    className?: string
  }) => (
    <Button
      onClick={onClick}
      className={cn(
        "h-16 rounded-2xl border-2 text-xl font-semibold transition-all",
        variant === "default" &&
          "border-border bg-card text-foreground hover:bg-muted",
        variant === "operation" &&
          "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
        variant === "action" &&
          "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
        variant === "equal" &&
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
    >
      {children}
    </Button>
  )

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-foreground">
          Calculadora
        </h1>

        {/* Display */}
        <div className="mb-4 rounded-2xl border-2 border-border bg-card p-6">
          <div className="text-right">
            {previousValue !== null && operation && (
              <p className="text-sm text-muted-foreground">
                {previousValue} {operation}
              </p>
            )}
            <p className="text-4xl font-bold text-foreground truncate">
              {display}
            </p>
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
          <CalcButton onClick={clear} variant="action">
            C
          </CalcButton>
          <CalcButton onClick={backspace} variant="action">
            <Delete className="h-5 w-5" />
          </CalcButton>
          <CalcButton onClick={() => performOperation("%")} variant="operation">
            <Percent className="h-5 w-5" />
          </CalcButton>
          <CalcButton onClick={() => performOperation("÷")} variant="operation">
            <Divide className="h-5 w-5" />
          </CalcButton>

          <CalcButton onClick={() => inputDigit("7")}>7</CalcButton>
          <CalcButton onClick={() => inputDigit("8")}>8</CalcButton>
          <CalcButton onClick={() => inputDigit("9")}>9</CalcButton>
          <CalcButton onClick={() => performOperation("×")} variant="operation">
            <X className="h-5 w-5" />
          </CalcButton>

          <CalcButton onClick={() => inputDigit("4")}>4</CalcButton>
          <CalcButton onClick={() => inputDigit("5")}>5</CalcButton>
          <CalcButton onClick={() => inputDigit("6")}>6</CalcButton>
          <CalcButton onClick={() => performOperation("-")} variant="operation">
            <Minus className="h-5 w-5" />
          </CalcButton>

          <CalcButton onClick={() => inputDigit("1")}>1</CalcButton>
          <CalcButton onClick={() => inputDigit("2")}>2</CalcButton>
          <CalcButton onClick={() => inputDigit("3")}>3</CalcButton>
          <CalcButton onClick={() => performOperation("+")} variant="operation">
            <Plus className="h-5 w-5" />
          </CalcButton>

          <CalcButton onClick={() => inputDigit("0")} className="col-span-2">
            0
          </CalcButton>
          <CalcButton onClick={inputDecimal}>.</CalcButton>
          <CalcButton onClick={calculate} variant="equal">
            <Equal className="h-5 w-5" />
          </CalcButton>
        </div>
      </div>
    </div>
  )
}
