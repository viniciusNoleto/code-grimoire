<template>
  <DemosReactMount :load="() => import('~/react-workbenches/cart-reducer').then(m => m.CartReducer)" />
</template>
