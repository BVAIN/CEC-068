
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
            <header>
                <h1 className="text-4xl font-bold tracking-tight font-headline">About CEC-068</h1>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Our Mission</CardTitle>
                </CardHeader>
                <CardContent className="text-lg text-muted-foreground leading-relaxed">
                    <p>
                        The Central Evaluation Centre (CEC) serves as the nodal hub for the systematic and transparent evaluation of answer scripts, ensuring accuracy, fairness, and timely declaration of results. At the CEC, teaching staff play a vital role as evaluators, bringing their subject expertise to assess the performance of students with diligence and impartiality. Senior faculty members often act as head examiners or coordinators, guiding and monitoring the evaluation process to maintain consistency and quality. Alongside them, non-teaching staff provide essential administrative and logistical support, including the secure handling, sorting, coding, and distribution of scripts, as well as data entry and record management. Their combined efforts create an organized framework where academic integrity and efficiency are upheld, making the CEC a crucial component of the examination system.
                    </p>
                </CardContent>
            </Card>

            <Separator />

            <div className="text-center text-muted-foreground">
                <p className="text-sm">Developed by</p>
                <p className="text-lg font-semibold">Prabhjeet Singh</p>
            </div>
        </div>
    );
}
