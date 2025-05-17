"use client";
import type { Worker, DailyPesajes } from '@/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface WorkerTableProps {
  weekNum: number;
  workersData: Worker[];
  dailyTotalsForWeek: { [day: string]: number };
  grandTotalForWeek: number;
  onWorkerDataChange: (workerIndex: number, day: string, pesajeIndex: number, value: number) => void;
  onWorkerNameChange: (workerIndex: number, name: string) => void;
  onDeleteWorker: (workerIndex: number) => void;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function WorkerTable({
  weekNum,
  workersData,
  dailyTotalsForWeek,
  grandTotalForWeek,
  onWorkerDataChange,
  onWorkerNameChange,
  onDeleteWorker,
}: WorkerTableProps) {
  
  // State to manage locked cells { [workerIndex_day]: boolean }
  const [lockedCells, setLockedCells] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Initialize locked cells based on existing data
    const initialLockedCells: { [key: string]: boolean } = {};
    workersData.forEach((worker, workerIdx) => {
      const weekEntries = worker.entries?.[weekNum.toString()] || {};
      DAYS_OF_WEEK.forEach(day => {
        const dayEntries = weekEntries[day] || [0, 0, 0];
        if (dayEntries.some(val => val > 0)) {
          initialLockedCells[`${workerIdx}_${day}`] = true;
        }
      });
    });
    setLockedCells(initialLockedCells);
  }, [workersData, weekNum]);


  const handlePesajeChange = (workerIndex: number, day: string, pesajeIndex: number, value: string) => {
    onWorkerDataChange(workerIndex, day, pesajeIndex, parseFloat(value) || 0);
  };
  
  const getDaySum = (worker: Worker, day: string): number => {
    const pesajes = worker.entries?.[weekNum.toString()]?.[day] || [0,0,0];
    return pesajes.reduce((sum, val) => sum + val, 0);
  };

  const getWeekSum = (worker: Worker): number => {
    let total = 0;
    DAYS_OF_WEEK.forEach(day => {
      total += getDaySum(worker, day);
    });
    return total;
  };

  const toggleLockCell = (workerIndex: number, day: string) => {
    const key = `${workerIndex}_${day}`;
    // Only allow unlocking if already locked
    if (lockedCells[key]) {
      setLockedCells(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePesajeBlur = (workerIndex: number, day: string) => {
    const key = `${workerIndex}_${day}`;
    const worker = workersData[workerIndex];
    const dayEntries = worker.entries?.[weekNum.toString()]?.[day] || [0,0,0];
    if (dayEntries.some(val => val > 0)) {
      setLockedCells(prev => ({ ...prev, [key]: true }));
    }
  };


  return (
    <div className="overflow-x-auto my-4 p-1 bg-card rounded-lg shadow-md">
      <h4 className="text-xl font-semibold mb-2 p-2">Semana {weekNum}</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Trabajador</TableHead>
            {DAYS_OF_WEEK.map(day => (
              <TableHead key={day} className="min-w-[180px] text-center">{day}</TableHead>
            ))}
            <TableHead className="text-center">Total Semana</TableHead>
            <TableHead className="w-[50px]">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workersData.map((worker, workerIdx) => (
            <TableRow key={worker.id || workerIdx}>
              <TableCell>
                <Input
                  value={worker.name}
                  onChange={(e) => onWorkerNameChange(workerIdx, e.target.value)}
                  placeholder="Nombre"
                  className="w-full"
                />
              </TableCell>
              {DAYS_OF_WEEK.map(day => {
                const pesajes = worker.entries?.[weekNum.toString()]?.[day] || [0,0,0];
                const cellKey = `${workerIdx}_${day}`;
                const isLocked = lockedCells[cellKey];
                return (
                  <TableCell key={day}>
                    <div className="pesaje-container space-y-1">
                      {isLocked && (
                         <Button variant="ghost" size="sm" onClick={() => toggleLockCell(workerIdx, day)} className="float-right p-1 h-auto">
                           <Lock className="h-3 w-3" />
                         </Button>
                       )}
                       {!isLocked && pesajes.some(p => p > 0) && ( // Show unlock if there's data but currently unlocked by interaction
                         <Button variant="ghost" size="sm" className="float-right p-1 h-auto invisible"> {/* Placeholder for alignment */}
                           <Unlock className="h-3 w-3" />
                         </Button>
                       )}
                      {[0, 1, 2].map(idx => (
                        <div key={idx} className="pesaje-row">
                          <span className="pesaje-label">P.{idx === 0 ? 'Ma' : idx === 1 ? 'Md' : 'T'}:</span>
                          <Input
                            type="number"
                            step="0.1"
                            value={pesajes[idx]?.toFixed(1) || '0.0'}
                            onChange={(e) => handlePesajeChange(workerIdx, day, idx, e.target.value)}
                            onBlur={() => handlePesajeBlur(workerIdx, day)}
                            className={`p-1 h-7 text-sm w-20 ${isLocked ? 'locked' : ''}`}
                            readOnly={isLocked}
                          />
                        </div>
                      ))}
                      <div className="day-sum pt-1 border-t border-border mt-1 text-right">{getDaySum(worker, day).toFixed(1)}</div>
                    </div>
                  </TableCell>
                );
              })}
              <TableCell className="text-center font-semibold">
                {getWeekSum(worker).toFixed(1)}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onDeleteWorker(workerIdx)} className="text-destructive hover:text-destructive-foreground hover:bg-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Total Diario</TableCell>
            {DAYS_OF_WEEK.map(day => (
              <TableCell key={day} className="text-center font-bold">
                {(dailyTotalsForWeek[day] || 0).toFixed(1)}
              </TableCell>
            ))}
            <TableCell className="text-center font-bold">
              {grandTotalForWeek.toFixed(1)}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
