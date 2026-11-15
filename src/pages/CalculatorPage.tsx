import { useState } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { toBangla } from '../lib/utils';

interface CalculatorProps {
  onBack: () => void;
}

export default function CalculatorPage({ onBack }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  const handleNumber = (num: string) => {
    if (isCalculated) {
      setDisplay(num);
      setIsCalculated(false);
    } else {
      // একাধিক ০ বা ডেসিমাল পয়েন্ট ঠেকানোর জন্য
      if (num === '.' && display.includes('.')) return;
      setDisplay(display === '0' && num !== '.' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setIsCalculated(false);
    
    // যদি আগের কোনো অপারেশন থেকে রেজাল্ট থাকে এবং নতুন অপারেটর চাপা হয় (চেইন ক্যালকুলেশন)
    if (equation && display !== '0') {
      const parts = equation.trim().split(' ');
      const num1 = parseFloat(parts[0]);
      const prevOp = parts[1];
      const num2 = parseFloat(display);
      
      let tempResult = 0;
      if (prevOp === '+') tempResult = num1 + num2;
      else if (prevOp === '-') tempResult = num1 - num2;
      else if (prevOp === '*') tempResult = num1 * num2;
      else if (prevOp === '/') tempResult = num2 !== 0 ? num1 / num2 : NaN;

      if (isNaN(tempResult)) {
        setDisplay('Error');
        setEquation('');
        return;
      }
      
      const safeResult = Number(tempResult.toFixed(10)).toString();
      setDisplay(safeResult);
      setEquation(safeResult + ' ' + op + ' ');
    } else {
      setEquation(display + ' ' + op + ' ');
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    try {
      if (!equation) return;
      
      const parts = equation.trim().split(' ');
      if (parts.length < 2) return;
      
      const num1 = parseFloat(parts[0]);
      const op = parts[1];
      const num2 = parseFloat(display);

      let result = 0;

      // eval() বাদ দিয়ে সেফ ক্যালকুলেশন
      switch (op) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': 
          if (num2 === 0) throw new Error("Division by zero");
          result = num1 / num2; 
          break;
        default: return;
      }

      // ফ্লোটিং পয়েন্ট এরর ঠিক করার জন্য (যেমন: 0.1 + 0.2 = 0.30000000000000004)
      const finalResult = Number(result.toFixed(10)).toString();
      
      setDisplay(finalResult);
      setEquation('');
      setIsCalculated(true);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsCalculated(false);
  };

  const handleDelete = () => {
    if (display.length === 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay((val / 100).toString());
    }
  };

  return (
    <div className="h-[100dvh] bg-[#EFF6F3] text-[#0F2A3D] font-serif flex flex-col overflow-hidden w-full">
      <header className="bg-gradient-to-r from-[#0B5C47] to-[#062D5E] text-white shadow-md shrink-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">ক্যালকুলেটর</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 pb-8">
        {/* ডিসপ্লে এরিয়া */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#D3E4DB] p-4 flex flex-col items-end justify-end h-40 mb-4">
          <div className="text-gray-500 text-sm h-6">{equation}</div>
          <div className="text-4xl font-black text-[#0F2A3D] mt-2 truncate w-full text-right">
            {display === 'Error' ? 'ভুল হয়েছে' : toBangla(display)}
          </div>
        </div>

        {/* কীবোর্ড */}
        <div className="grid grid-cols-4 gap-2 flex-1">
          <button onClick={handleClear} className="bg-[#FEE2E2] text-[#B91C1C] rounded-xl font-bold text-xl active:scale-95 transition shadow-sm">C</button>
          <button onClick={handleDelete} className="bg-[#F1F5F9] text-[#334155] rounded-xl font-bold text-xl flex items-center justify-center active:scale-95 transition shadow-sm"><Delete size={22}/></button>
          <button onClick={handlePercent} className="bg-[#F1F5F9] text-[#334155] rounded-xl font-bold text-xl active:scale-95 transition shadow-sm">%</button>
          <button onClick={() => handleOperator('/')} className="bg-[#E0F2FE] text-[#0369A1] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm">÷</button>

          <button onClick={() => handleNumber('7')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৭</button>
          <button onClick={() => handleNumber('8')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৮</button>
          <button onClick={() => handleNumber('9')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৯</button>
          <button onClick={() => handleOperator('*')} className="bg-[#E0F2FE] text-[#0369A1] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm">×</button>

          <button onClick={() => handleNumber('4')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৪</button>
          <button onClick={() => handleNumber('5')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৫</button>
          <button onClick={() => handleNumber('6')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৬</button>
          <button onClick={() => handleOperator('-')} className="bg-[#E0F2FE] text-[#0369A1] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm">−</button>

          <button onClick={() => handleNumber('1')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">১</button>
          <button onClick={() => handleNumber('2')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">২</button>
          <button onClick={() => handleNumber('3')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">৩</button>
          <button onClick={() => handleOperator('+')} className="bg-[#E0F2FE] text-[#0369A1] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm">+</button>

          <button onClick={() => handleNumber('0')} className="col-span-2 bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">০</button>
          <button onClick={() => handleNumber('.')} className="bg-white text-[#0F2A3D] rounded-xl font-bold text-2xl active:scale-95 transition shadow-sm border border-gray-100">.</button>
          <button onClick={handleCalculate} className="bg-[#0B5C47] text-white rounded-xl font-bold text-3xl active:scale-95 transition shadow-md">=</button>
        </div>
      </main>
    </div>
  );
}