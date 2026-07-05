'use client'

import { Card, CardHeader, CardTitle } from "@/tool/components/ui/card";
import { X } from "lucide-react";


import { startTransition, useState } from "react"
import { Button } from "./ui/button";
import { cn } from "@/tool/lib/utils";

export default function Boxes() {
  const [boxes, setBoxes] = useState([
    { id: 2, name: 'component' },
    { id: 3, name: 'hooks' },
    { id: 4, name: 'props' },
    { id: 5, name: 'context' },
    { id: 6, name: 'state' },

  ])
  const [isOn, setIsOn] = useState(false);
  function deleteBox(id: number) {
    startTransition(() => {
      const newBoxes = boxes.filter((box => box.id !== id))
      setBoxes(newBoxes)
      //   console.log('run')
    })
  }

  function animateBoxes() {
    startTransition(() => {
      setIsOn(!isOn);
    })
  }

  return (

    <div className="flex gap-4 flex-wrap justify-start  my-6">
      {boxes.map((box) =>
        <div key={box.id}>
          <Card onClick={() => deleteBox(box.id)}>
            <CardHeader className="items-center">
              <CardTitle>{box.name}</CardTitle>
              <X onClick={() => deleteBox(box.id)} className="text-red-600" />
            </CardHeader>
          </Card>
        </div>

      )}

      <div className={cn("w-full flex gap-4", isOn ? 'justify-between' : 'justify-center')}>
        <div className="w-24 h-24 bg-red-500"></div>
        <div className="w-24 h-24 bg-red-500"></div>
        <div className="w-24 h-24 bg-red-500"></div>

      </div>
      {isOn ? <div></div> : <div></div>}
      <Button onClick={() => animateBoxes()}>Click me</Button>
    </div>
  )
}
