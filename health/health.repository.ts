import prisma from "../prisma/prisma";

import { HealthType } from '@prisma/client'; // this is the set of types

// Get the latest baseline value for a given metric
export async function getHRVBaseline(userId: number) {
	return await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.hrvBaseline } },
	});
}

export async function getRHRBaseline(userId: number) {
	return await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.rhrBaseline } },
	});
}

export async function getSleepBaseline(userId: number) {
	return await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.sleepBaseline } },
	});
}

export async function getStepsBaseline(userId: number) {
	return await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.stepsBaseline } },
	});
}
// if value exists for user update it, if not create it
export async function setHRVBaseline(userId: number, newValue: number, date: Date) {
	return await prisma.healthData.upsert({
		where: { userId_type: { userId, type: HealthType.hrvBaseline } },
		update: { value: newValue, createdAt: date },
		create: { userId, type: HealthType.hrvBaseline, value: newValue, createdAt: date },
	});
}

export async function setRHRBaseline(userId: number, newValue: number, date: Date) {
	return await prisma.healthData.upsert({
		where: { userId_type: { userId, type: HealthType.rhrBaseline } },
		update: { value: newValue, createdAt: date },
		create: { userId, type: HealthType.rhrBaseline, value: newValue, createdAt: date },
	});
}

export async function setSleepBaseline(userId: number, newValue: number, date: Date) {
	return await prisma.healthData.upsert({
		where: { userId_type: { userId, type: HealthType.sleepBaseline } },
		update: { value: newValue, createdAt: date },
		create: { userId, type: HealthType.sleepBaseline, value: newValue, createdAt: date },
	});
}

export async function setStepsBaseline(userId: number, newValue: number, date: Date) {
	return await prisma.healthData.upsert({
		where: { userId_type: { userId, type: HealthType.stepsBaseline } },
		update: { value: newValue, createdAt: date },
		create: { userId, type: HealthType.stepsBaseline, value: newValue, createdAt: date },
	});
}

// check to see if a baseline doesnt exists or if its older than 30 days

export async function checkHRVBaseline(userId: number) {
	const today = new Date();
	const baseline = await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.hrvBaseline } },
	});
	if (!baseline || !baseline.createdAt) return true;                                     //time holds ms
	const days = (today.getTime() - baseline.createdAt.getTime()) / (1000 * 60 * 60 * 24);
	return days >= 30;                                              //divide by 1000ms,60sec,60min,24hour to get days
}

export async function checkRHRBaseline(userId: number) {
	const today = new Date();
	const baseline = await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.rhrBaseline } },
	});
	if (!baseline || !baseline.createdAt) return true;
	const days = (today.getTime() - baseline.createdAt.getTime()) / (1000 * 60 * 60 * 24);
	return days >= 30;
}

export async function checkSleepBaseline(userId: number) {
	const today = new Date();
	const baseline = await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.sleepBaseline } },
	});
	if (!baseline || !baseline.createdAt) return true;
	const days = (today.getTime() - baseline.createdAt.getTime()) / (1000 * 60 * 60 * 24);
	return days >= 30;
}

export async function checkStepsBaseline(userId: number) {
	const today = new Date();
	const baseline = await prisma.healthData.findUnique({
		where: { userId_type: { userId, type: HealthType.stepsBaseline } },
	});
	if (!baseline || !baseline.createdAt) return true;
	const days = (today.getTime() - baseline.createdAt.getTime()) / (1000 * 60 * 60 * 24);
	return days >= 30;
}