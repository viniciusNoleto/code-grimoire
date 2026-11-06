<template>
  <DemosReactMount :load="() => import('~/react-workbenches/slow-list').then(m => m.SlowListLab)" />
</template>
